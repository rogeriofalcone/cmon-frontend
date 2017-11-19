package main

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os/exec"

	"github.com/kataras/iris/sessions"
)

// Checks if there is an authorization flag set in the session
// object and returns its boolean value
func isAuthorized(s *sessions.Session) bool {
	a, err := s.GetBoolean(SessionKeyAuthorized)
	if err != nil {
		return false
	}
	return a
}

// Returns cmon version
func getCmonVersion() string {
	var out bytes.Buffer
	cmd := exec.Command("cmon", "-v")
	cmd.Stdout = &out
	err := cmd.Run()
	if err != nil {
		return "unknown"
	}
	return out.String()
}

// Returns ui version
func getUIVersion() string {
	return fmt.Sprintf("%s.%s", mainVersion, buildVersion)
}

// Proxy a request to RPC
func rpcProxy(p string, method string, key string, body io.ReadCloser) (*http.Response, error) {
	// Create HTTP client
	client := &http.Client{
		Transport: &http.Transport{
			// Skip SSL certificate validation
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true,
			},
		},
	}
	// Generate a url to make a request to RPC
	url, err := config.RPC.Path(p)
	if err != nil {
		return nil, err
	}
	// Generate HTTP request
	req := &http.Request{
		Method: method,
		Host:   config.RPC.Host,
		URL:    url,
		Body:   body,
		Header: http.Header{},
	}
	req.AddCookie(&http.Cookie{
		Name:  RPCKeyCmonSessionID,
		Value: key,
	})
	// Execute the request
	return client.Do(req)
}

// Make a request to RPC
func rpcRequest(p string, key string, data interface{}) (*http.Response, error) {
	// Create HTTP client
	client := &http.Client{
		Transport: &http.Transport{
			// Skip SSL certificate validation
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true,
			},
		},
	}
	// Generate a url to make a request to RPC
	url, err := config.RPC.Path(p)
	if err != nil {
		return nil, err
	}
	// Generate request JSON
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}
	app.Logger().Println(string(jsonData))
	// Generate request
	req, err := http.NewRequest("POST", url.String(), bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}
	req.AddCookie(&http.Cookie{
		Name:  RPCKeyCmonSessionID,
		Value: key,
	})
	// Execute the request
	return client.Do(req)
}

// Load clusters and hosts ids from RPC
func getUserClusters(key string) (map[int][]CmonHost, error) {
	r := struct {
		Operation string `json:"operation"`
		WithHosts bool   `json:"with_hosts"`
	}{"getAllClusterInfo", true}
	rpcRes, err := rpcRequest("clusters", key, r)
	if err != nil {
		return nil, err
	}
	v := &struct {
		Clusters []struct {
			ClusterID int        `json:"cluster_id"`
			Hosts     []CmonHost `json:"hosts"`
		} `json:"clusters"`
	}{}
	err = json.NewDecoder(rpcRes.Body).Decode(v)
	if err != nil {
		return nil, err
	}
	ids := map[int][]CmonHost{}
	for _, c := range v.Clusters {
		ids[c.ClusterID] = c.Hosts
	}
	app.Logger().Println(ids, *v)
	return ids, nil
}
