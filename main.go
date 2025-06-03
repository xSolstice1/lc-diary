package main

import (
	"fmt"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
)

type Problem struct {
	ID          int       `json:"id"`
	LCNumber    int       `json:"lc_number"`
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

	problems := []Problem{}

	//post problem
	app.Post("/api/problems", func(c *fiber.Ctx) error {
		problem := &Problem{}

		if err := c.BodyParser(problem); err != nil {
			return err
		}

		if problem.Title == "" {
			return c.Status(400).JSON(fiber.Map{"error": "Problem Title is required!"})
		}

		problem.ID = len(problems) + 1
		problems = append(problems, *problem)

		return c.Status(201).JSON(problem)
	})

	log.Fatal(app.Listen(":4000"))
}
