package main

import (
	"github.com/kataras/iris/context"
)

type CmonController struct {
}

func (c *CmonController) PostEvent(ctx context.Context) {
	// Don't do anything if there are no sockets connected
	if len(sockets) == 0 {
		return
	}

	var cid = 0
	var hid = 0
	var hnm = ""

	// Read request JSON into a map
	e := &context.Map{}
	err := ctx.ReadJSON(e)
	if err != nil {
		app.Logger().Warn(err)
		return
	}

	// Convert pointer to var
	event := *e

	// Extract data from event
	if specifics, ok := event["event_specifics"]; ok {
		app.Logger().Println(specifics)
		sp := specifics.(map[string]interface{})
		// Try to extract cluster id
		if i, ok := sp["cluster_id"]; ok {
			cid = int(i.(float64))
		}
		// Try to extract hostname
		if hn, ok := sp["host_name"]; ok {
			hnm = hn.(string)
		}
		// Try to extact host id
		if h, ok := sp["host"]; ok {
			host := h.(map[string]interface{})
			if i, ok := host["hostId"]; ok {
				hid = int(i.(float64))
			}
		}
	}

	if cid > 0 {
		// If cluster id presists - broadcast by cluster id
		sockets.BroadcastByCluster(cid, WebSocketEventCmonEvent, event)
	} else if hid > 0 {
		// If host id presists - broadcast by host id
		sockets.BroadcastByHostID(hid, WebSocketEventCmonEvent, event)
	} else if hnm != "" {
		// If host name presists - broadcast by host name
		sockets.BroadcastByHostName(hnm, WebSocketEventCmonEvent, event)
	} else {
		// Broadcast all others to all
		sockets.Broadcast(WebSocketEventCmonEvent, event)
	}
}

type CmonHost struct {
	HostID   int    `json:"hostId"`
	HostName string `json:"hostname"`
}
