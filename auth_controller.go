package main

import (
	"encoding/gob"
	"encoding/json"
	"net/http"
	"time"

	"github.com/kataras/iris/context"
	"github.com/kataras/iris/mvc"
	"github.com/kataras/iris/sessions"
)

// Initialize the module
func init() {
	// Register User struct for serialization
	gob.Register(User{})
}

// AuthController is controlling the authentication process
type AuthController struct {
	mvc.C
	Manager *sessions.Sessions
	Session *sessions.Session
	Context context.Context
}

// BeginRequest runs before each request
func (c *AuthController) BeginRequest(ctx context.Context) {
	c.C.BeginRequest(ctx)
	c.Context = ctx
	if c.Manager == nil {
		ctx.Application().Logger().Errorf(`AuthController: sessions manager is nil, you should bind it`)
		ctx.StopExecution()
		return
	}

	// set the `c.Session` we will use that in our Get method.
	c.Session = c.Manager.Start(ctx)
}

// PostLogin handles POST requests to /login
func (c *AuthController) PostLogin() interface{} {
	req := &AuthRequest{}
	err := c.Context.ReadJSON(req)
	if err != nil {
		return HTTPError{"Failed to parse request JSON"}
	}
	req.Operation = "authenticateWithPassword"
	res, err := rpcRequest("auth", c.Session.GetString(SessionKeyCmonSid), req)
	if err != nil {
		return HTTPError{err.Error()}
	}
	resData := &AuthResponse{}
	err = json.NewDecoder(res.Body).Decode(resData)
	if err != nil {
		return HTTPError{err.Error()}
	}
	c.Session.Set(SessionKeyAuthorized, true)
	c.Session.Set(SessionKeyUser, resData.User)
	c.Session.Set(SessionKeyCmonSid, getCmonSessionID(res.Cookies()))
	return resData
}

// PostLogout handles POST requests to /logout
func (c *AuthController) PostLogout() string {
	c.Session.Clear()
	return "{}"
}

// AuthRequest is used to make auth requests to CMON
type AuthRequest struct {
	Username  string `json:"user_name,omitempty"`
	Password  string `json:"password,omitempty"`
	Operation string `json:"operation,omitempty"`
}

// AuthResponse contains the auth reponse data from CMON
type AuthResponse struct {
	RequestStatus string `json:"request_status,omitempty"`
	ErrorString   string `json:"error_string,omitempty"`
	User          User   `json:"user,omitempty"`
}

// User is the CMON user model
type User struct {
	UserID    int       `json:"user_id,omitempty"`
	FirstName string    `json:"first_name,omitempty"`
	LastName  string    `json:"last_name,omitempty"`
	UserName  string    `json:"user_name,omitempty"`
	LastLogin time.Time `json:"last_login,omitempty"`
	Groups    []struct {
		GroupID   int    `json:"group_id,omitempty"`
		GroupName string `json:"group_name,omitempty"`
	} `json:"groups,omitempty"`
}

func getCmonSessionID(cookies []*http.Cookie) string {
	for _, cookie := range cookies {
		if cookie.Name == RPCKeyCmonSessionID {
			return cookie.Value
		}
	}
	return ""
}
