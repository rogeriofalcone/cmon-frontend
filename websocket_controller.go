package main

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/kataras/iris/websocket"
)

const (
	// WebSocketEventCmonEvent represents the event category
	// name that is sent to socket
	WebSocketEventCmonEvent = "cmon_event"
)

var (
	// WebSocket
	wsMain  = websocket.New(websocket.Config{})
	wsStat  = websocket.New(websocket.Config{})
	sockets = Sockets{}
	mutex   = new(sync.Mutex)
)

func mainWebsocketHandler(c websocket.Connection) {
	// c.Join(myChatRoom)
	s := sess.Start(c.Context())

	// Always check that the user is authorized
	if !isAuthorized(s) {
		c.Emit("error", "unauthorized")
		return
	}

	// Get User object from session
	user := s.Get(SessionKeyUser).(User)

	// Get user's clusters and hosts from RPC
	// This is required to apply access rules, only users who
	// have access to cluster/host will receive events from cmon
	cids, err := getUserClusters(s.GetString(SessionKeyCmonSid))
	if err != nil {
		c.Emit("error", err.Error())
		return
	}

	// Save socket in sockets list
	mutex.Lock()
	sockets[c] = Socket{
		User:     user,
		Clusters: cids,
	}
	mutex.Unlock()

	// Remove the socket from list if disconnected
	c.OnDisconnect(func() {
		mutex.Lock()
		delete(sockets, c)
		mutex.Unlock()
	})
}

func statWebsocketHandler(c websocket.Connection) {
	s := sess.Start(c.Context())

	// Always check that the user is authorized
	if !isAuthorized(s) {
		c.Emit("error", "unauthorized")
		return
	}

	// Get cluster ID
	clusterID, err := c.Context().URLParamInt("cid")
	if err != nil {
		c.Emit("error", err.Error())
		return
	}

	// Get cluster ID
	hostID, err := c.Context().URLParamInt("hid")
	if err != nil {
		c.Emit("error", err.Error())
		return
	}

	// Generate request body
	request := &StatRequest{
		Operation:  "statByName",
		ClusterID:  clusterID,
		HostID:     hostID,
		Compact:    true,
		StatType:   c.Context().URLParam("type"),
		StatFields: c.Context().URLParam("fields") + ",created,sampleends",
		StatStart:  c.Context().URLParam("from"),
		StatEnd:    c.Context().URLParam("to"),
	}

	// Fetch initial data
	initialData, _, err := getStatByName(s.GetString(SessionKeyCmonSid), request)
	if err != nil {
		c.Emit("error", err.Error())
		return
	}
	c.Emit("init", initialData)

	// Keep fetching data if the end time is not specified
	if request.StatEnd == "" {
		ticker := time.NewTicker(time.Second * 3)
		// Stop the ticker when the socket closes
		c.OnDisconnect(func() {
			fmt.Println("stop")
			ticker.Stop()
		})
		c.OnError(func(e string) {
			fmt.Println("error")
			ticker.Stop()
		})
		go func(c websocket.Connection, key string, req *StatRequest) {
			for range ticker.C {
				fmt.Println("more")
				data, l, _ := getStatByName(key, req)
				if l > 0 {
					c.Emit("point", data)
				}
			}
		}(c, s.GetString(SessionKeyCmonSid), request)
	}
}

func getStatByName(key string, r *StatRequest) (interface{}, int, error) {
	res, err := rpcRequest("stat", key, r)
	if err != nil {
		return nil, 0, err
	}

	// Decode JSON to this struct
	data := &struct {
		Data []map[string]interface{} `json:"data"`
	}{}

	// Decode JSON
	err = json.NewDecoder(res.Body).Decode(data)
	if err != nil {
		return nil, 0, err
	}

	l := len(data.Data)
	if l > 0 {
		// Create fields array
		fields := strings.Split(r.StatFields, ",")

		// Create an export object
		export := map[string][][]int{}

		// Fill export object with fields keys
		for _, field := range fields {
			if field == "created" || field == "sampleends" {
				continue
			}
			export[field] = [][]int{}
			for _, stat := range data.Data {
				se := int(stat["created"].(float64)) * 1000
				re := int(stat[field].(float64))
				export[field] = append(export[field], []int{se, re})

				// export[field][se] = append(export[field][se], stat[field].(float64))
			}
		}

		// Set next timestamp to load from
		sampleEnds := data.Data[l-1]["created"].(float64)
		r.StatStart = strconv.Itoa(int(sampleEnds) + 1)

		return export, l, nil
	}

	return data.Data, l, nil
}

type StatRequest struct {
	Operation  string `json:"operation,omitempty"`
	ClusterID  int    `json:"cluster_id,omitempty"`
	HostID     int    `json:"hostid,omitempty"`
	Compact    bool   `json:"compact_format,omitempty"`
	StatType   string `json:"name,omitempty"`
	StatFields string `json:"fields,omitempty"`
	StatStart  string `json:"start_datetime,omitempty"`
	StatEnd    string `json:"end_datetime,omitempty"`
	lastSample int
}

// Socket contains User and basic clusters/hosts info
type Socket struct {
	User     User
	Clusters map[int][]CmonHost
}

// HasCluster returns true if the Socket contains a cluster (by id)
func (s Socket) HasCluster(cid int) bool {
	_, exists := s.Clusters[cid]
	return exists
}

// HasHostID returns true if the Socket contains a host (by host id)
func (s Socket) HasHostID(id int) bool {
	for _, c := range s.Clusters {
		for _, h := range c {
			if h.HostID == id {
				return true
			}
		}
	}
	return false
}

// HasHostName returns true if the Socket contains a host (by host name)
func (s Socket) HasHostName(name string) bool {
	for _, c := range s.Clusters {
		for _, h := range c {
			if h.HostName == name {
				return true
			}
		}
	}
	return false
}

// Sockets is a container for curretly connected sockets list
type Sockets map[websocket.Connection]Socket

// Broadcast will send a message to all connected sockets
func (s Sockets) Broadcast(k string, v interface{}) {
	for c := range s {
		c.Emit(k, v)
	}
}

// BroadcastByHostID will send a message to all connected sockets,
// filtered by host id
func (s Sockets) BroadcastByHostID(hid int, k string, v interface{}) {
	for c, socket := range s {
		if socket.HasHostID(hid) {
			c.Emit(k, v)
		}
	}
}

// BroadcastByHostName will send a message to all connected sockets,
// filtered by host name
func (s Sockets) BroadcastByHostName(hnm string, k string, v interface{}) {
	for c, socket := range s {
		if socket.HasHostName(hnm) {
			c.Emit(k, v)
		}
	}
}

// BroadcastByCluster will send a message to all connected sockets,
// filtered by cluster id
func (s Sockets) BroadcastByCluster(cid int, k string, v interface{}) {
	for c, socket := range s {
		if socket.HasCluster(cid) {
			c.Emit(k, v)
		}
	}
}
