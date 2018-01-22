package main

import (
	"encoding/json"

	"github.com/kataras/iris/context"
	"github.com/kataras/iris/sessions"
)

type AlarmsController struct {
	Manager *sessions.Sessions
	Session *sessions.Session
}

// BeginRequest runs before each request
func (a *AlarmsController) BeginRequest(ctx context.Context) {
	if a.Manager == nil {
		ctx.Application().Logger().Errorf(`AuthController: sessions manager is nil, you should bind it`)
		ctx.StopExecution()
		return
	}
	a.Session = a.Manager.Start(ctx)
}

func (a *AlarmsController) GetAll() interface{} {
	if !isAuthorized(a.Session) {
		return HTTPError{"only authorized users can access /json/alarms/all"}
	}

	alarms := []context.Map{}
	rpcKey := a.Session.GetString(SessionKeyCmonSid)

	clusters, err := getUserClusters(rpcKey)
	if err != nil {
		return HTTPError{err.Error()}
	}
	for cid := range clusters {
		app.Logger().Println("CID", cid)
		rpcRes, err := rpcRequest("alarm", rpcKey, struct {
			Operation string `json:"operation"`
			ClusterID int    `json:"cluster_id"`
		}{"getAlarms", cid})
		if err != nil {
			return HTTPError{err.Error()}
		}
		alarm := &struct {
			Alarms        []context.Map `json:"alarms"`
			RequestStatus string        `json:"request_status"`
		}{[]context.Map{}, ""}
		err = json.NewDecoder(rpcRes.Body).Decode(alarm)
		if err != nil {
			return HTTPError{err.Error()}
		}
		for _, a := range alarm.Alarms {
			alarms = append(alarms, a)
		}
	}

	return alarms
}
