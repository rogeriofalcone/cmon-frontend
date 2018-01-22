//
//
// ClusterControl Backend Application
//
//
// @version 2
// @authors Simon Kamenetskii
// @website http://www.severalnines.com/
//
//
package main

// Application dependencies
import (
	"flag"
	"fmt"
	"io"
	"os"
	"runtime"

	"github.com/kataras/iris"
	"github.com/kataras/iris/context"
	"github.com/kataras/iris/mvc"
	"github.com/kataras/iris/sessions"
	"github.com/kataras/iris/sessions/sessiondb/boltdb"
	"github.com/kataras/iris/websocket"
)

// Version variables
// These variables contain app version and are dynamically
// assign during the build process
var (
	mainVersion  = "2.0.0"
	buildVersion = "dev"
	cmonVersion  = ""
)

const (
	// SessionKeyAuthorized represents the session key that
	// identifies either the user is authorized or not
	SessionKeyAuthorized = "authorized"

	// SessionKeyUser represents the session key that
	// contains the user data from CMON
	SessionKeyUser = "user"

	// SessionKeyCmonSid represents the session key that
	// contains the latest cmon session id
	SessionKeyCmonSid = "rpcSid"

	// RPCKeyCmonSessionID represents the cookie name to
	// take CMON session id from
	RPCKeyCmonSessionID = "cmon-sid"
)

// Flag variables
// These variables contain flags that are set from the command line
var (
	flagVersion = flag.Bool("version", false, "Show version")
	flagDebug   = flag.Bool("debug", false, "Run in debug mode")
	flagConfig  = flag.String("config", "/etc/clustercontrol.cnf", "Path to config file")
)

// Working variables
var (
	// Application config
	config = &Config{}

	// Application
	app = iris.New()

	// Sessions
	sess = sessions.New(sessions.Config{
		Cookie:                      "ccsid",
		Expires:                     0,
		DisableSubdomainPersistence: false,
	})

	// Version
	version = struct {
		UI   string `json:"ui"`
		CMON string `json:"cmon"`
	}{
		UI:   getUIVersion(),
		CMON: getCmonVersion(),
	}
)

// Application entry point
// Everything starts here
func main() {
	// Parse command line flags
	flag.Parse()

	// Check if we only need to show the app version
	if *flagVersion {
		showVersion()
	}

	// Debug mode?
	if *flagDebug {
		app.Logger().SetLevel("debug")
	}

	// Load configurations
	err := loadConfig()
	if err != nil {
		app.Logger().Fatal("failed to load config file: ", err)
	}

	// Set sessions database
	db, err := boltdb.New(config.HTTP.Path("sessions.db"), 0666, "users")
	if err != nil {
		app.Logger().Fatal("failed to open sessions database: ", err)
	}
	sess.UseDatabase(db)

	// Define path to static files
	app.StaticWeb("/js", config.HTTP.Path("public/js"))
	app.StaticWeb("/css", config.HTTP.Path("public/css"))
	app.StaticWeb("/fonts", config.HTTP.Path("public/fonts"))
	app.StaticWeb("/assets", config.HTTP.Path("public/assets"))

	// Register app views
	app.RegisterView(iris.HTML(config.HTTP.Path("templates"), ".html"))

	// WebSocket
	app.Get("/js/websocket.js", websocket.ClientHandler())
	app.Get("/socket", wsMain.Handler())
	app.Get("/socket/stat", wsStat.Handler())
	wsMain.OnConnection(mainWebsocketHandler)
	wsStat.OnConnection(statWebsocketHandler)

	// Handle RPC requests
	app.Any("/rpc/{path:path}", func(ctx context.Context) {
		// Start session
		s := sess.Start(ctx)
		// Check if the user is authorized
		if !isAuthorized(s) {
			ctx.JSON(HTTPError{"Only authorized users can access /rpc"})
			return
		}
		// Execute RPC request
		res, err := rpcProxy(
			ctx.Params().Get("path"),
			ctx.Method(),
			s.GetString(SessionKeyCmonSid),
			ctx.Request().Body)
		if err != nil {
			ctx.JSON(HTTPError{err.Error()})
			return
		}
		// Send the response to client
		io.Copy(ctx.ResponseWriter(), res.Body)
	})

	// Handle version path
	app.Get("/version", func(ctx context.Context) {
		ctx.JSON(version)
	})

	// Controllers
	authMVC := mvc.New(app.Party("/json/auth"))
	authMVC.Handle(new(AuthController))
	authMVC.Register(sess)
	// app.Controller("/json/auth", new(AuthController), sess)
	// app.Controller("/json/alarms", new(AlarmsController), sess)
	alarmsMVC := mvc.New(app.Party("/json/alarms"))
	alarmsMVC.Handle(new(AlarmsController))
	alarmsMVC.Register(sess)
	// app.Controller("/cmon", new(CmonController))
	cmonMVC := mvc.New(app.Party("/cmon"))
	cmonMVC.Handle(new(CmonController))
	cmonMVC.Register(sess)

	// Hadle all other request
	// Required for using angular in html5mode
	appMVC := mvc.New(app.Party("/"))
	appMVC.Handle(new(IndexController))
	appMVC.Register(sess)
	// app.Controller("/", new(IndexController), sess)
	// app.Controller("{root:path}", new(IndexController), sess)
	app2MVC := mvc.New(app.Party("{root:path}"))
	app2MVC.Handle(new(IndexController))
	app2MVC.Register(sess)

	// Start the application
	app.Run(
		iris.Addr(config.HTTP.GetAddr()),
		iris.WithoutVersionChecker)

	m := &runtime.MemStats{}
	runtime.ReadMemStats(m)
}

// Output version number and exit
func showVersion() {
	fmt.Printf("%s.%s\n", mainVersion, buildVersion)
	os.Exit(0)
}

// HTTPError is used to format an error HTTP response (as JSON)
type HTTPError struct {
	ErrorString string `json:"error_string"`
}
