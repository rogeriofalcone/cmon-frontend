package main

import (
	"fmt"
	"net/url"
	"path"

	"github.com/go-ini/ini"
)

// Loads configuration from cnf file provided in "config" flag
func loadConfig() error {
	return ini.MapTo(config, *flagConfig)
}

// Config contains application configurations
type Config struct {
	HTTP ConfigHTTP `ini:"http"`
	RPC  ConfigRPC  `ini:"rpc"`
	Prometheus ConfigPrometheus `ini:"prometheus"`
}

// ConfigHTTP contains http configurations
type ConfigHTTP struct {
	Host string `ini:"host"`
	Port string `ini:"port"`
	Root string `ini:"root"`
}

// GetAddr returns http server addr
func (c *ConfigHTTP) GetAddr() string {
	return fmt.Sprintf("%s:%s", c.Host, c.Port)
}

// Path returns a concatenated path to file/dir in root
func (c *ConfigHTTP) Path(p ...string) string {
	return path.Join(append([]string{c.Root}, p...)...)
}

// ConfigRPC contains RPC configurations
type ConfigRPC struct {
	Host string `ini:"host"`
	Port string `ini:"port"`
}

// GetAddr returns http address to send RPC request to
func (c *ConfigRPC) GetAddr() string {
	app.Logger().Println(c)
	return fmt.Sprintf("https://%s:%s", c.Host, c.Port)
}

// Path returns a parsed URL for http request to cmon RPC
func (c *ConfigRPC) Path(p string) (*url.URL, error) {
	url, err := url.Parse(c.GetAddr())
	if err != nil {
		return nil, err
	}
	url.Path = path.Join("v2", p)
	return url, nil
}

// ConfigPrometheus 
type ConfigPrometheus struct {
	Host string `ini:"host"`
	Port string `ini:"port"`
}

// GetAddr returns http address to send RPC request to Prometheus
func (c *ConfigPrometheus) GetAddr() string {
	return fmt.Sprintf("http://%s:%s/prometheus/api/v1/query_range", c.Host, c.Port)
}

// Path returns a parsed URL for http request to Prometheus
func (c *ConfigPrometheus) Path() (*url.URL, error) {
	return url.Parse(c.GetAddr())
}
