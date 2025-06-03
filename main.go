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

	//fetch problem
	app.Get("/api/problems", func(c *fiber.Ctx) error {
		return c.JSON(problems)
	})

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
		problem.CreatedTime = time.Now()
		problem.UpdatedTime = time.Now()
		problems = append(problems, *problem)

		return c.Status(201).JSON(problem)
	})

	//update problem
	app.Put("/api/problems/:id", func(c *fiber.Ctx) error {
		id, err := c.ParamsInt("id")
		if err != nil || id <= 0 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID"})
		}

		problem := new(Problem)
		if err := c.BodyParser(problem); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
		}

		for i, p := range problems {
			if p.ID == id {
				problem.ID = id
				problem.CreatedTime = p.CreatedTime
				problem.UpdatedTime = time.Now()
				problems[i] = *problem
				return c.JSON(problem)
			}
		}

		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Problem not found"})
	})

	//delete problem
	app.Delete("/api/problems/:id", func(c *fiber.Ctx) error {
		id, err := c.ParamsInt("id")
		if err != nil || id <= 0 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID"})
		}
		for i, p := range problems {
			if p.ID == id {
				problems = append(problems[:i], problems[i+1:]...)
				return c.SendStatus(fiber.StatusNoContent)
			}
		}
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Problem not found"})
	})

	log.Fatal(app.Listen(":4000"))
}
