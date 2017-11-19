package main

import (
	"time"

	"github.com/kataras/iris/context"
	"github.com/kataras/iris/mvc"
	"github.com/kataras/iris/sessions"
)

// IndexController controlls the root path
type IndexController struct {
	mvc.C
	Manager *sessions.Sessions
	Session *sessions.Session
	Context context.Context
}

// BeginRequest runs before each request
func (i *IndexController) BeginRequest(ctx context.Context) {
	i.C.BeginRequest(ctx)
	i.Context = ctx
	if i.Manager == nil {
		ctx.Application().Logger().Errorf(`AuthController: sessions manager is nil, you should bind it`)
		ctx.StopExecution()
		return
	}

	// set the `c.Session` we will use that in our Get method.
	i.Session = i.Manager.Start(ctx)
}

// Any handles all requests
func (i *IndexController) Any() mvc.View {

	viewData := map[string]interface{}{
		"version":   version,
		"timestamp": time.Now().Unix(),
	}
	// Set version data to view
	// ctx.ViewData("version", version)

	// Check if the user is authorized
	if !isAuthorized(i.Session) {
		// ctx.View("auth.html")
		return mvc.View{
			Name: "auth.html",
			Data: viewData,
		}
	}

	return mvc.View{
		Name: "main.html",
		Data: viewData,
	}
	// Render main view
	// ctx.View("main.html")
}
