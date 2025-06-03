package main

import (
	"fmt"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
)

type Problem struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	Tags        []string  `json:"tags"`
	Difficulty  string    `json:"difficulty"`
	Solution    string    `json:"solution"`
	Notes       string    `json:"notes"`
	Completed   bool      `json:"completed"`
	CreatedTime time.Time `json:"created_time"`
	UpdatedTime time.Time `json:"updated_time"`
}

func main() {
	app := fiber.New()
	fmt.Println("hello")

	app.Get("/", func(c *fiber.Ctx) error {
		return c.Status(200).JSON(fiber.Map{"msg": "hello world"})
	})

	log.Fatal(app.Listen(":4000"))
}
