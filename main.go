package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Problem struct {
	ID          primitive.ObjectID `json:"id,omitempty" bson:"_id,omitempty"`
	LCNumber    string             `json:"lcnumber"`
	Title       string             `json:"title"`
	Tags        []string           `json:"tags"`
	Difficulty  string             `json:"difficulty"`
	Solution    string             `json:"solution"`
	Notes       string             `json:"notes"`
	Completed   bool               `json:"completed"`
	CreatedTime time.Time          `json:"created_time"`
	UpdatedTime time.Time          `json:"updated_time"`
}

var collection *mongo.Collection

func main() {
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatal("Error loading env file!", err)
	}

	MONGODB_URI := os.Getenv("MONGODB_URI")
	clientOptions := options.Client().ApplyURI(MONGODB_URI)
	client, err := mongo.Connect(context.Background(), clientOptions)

	if err != nil {
		log.Fatal(err)
	}

	defer client.Disconnect(context.Background())

	err = client.Ping(context.Background(), nil)

	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Connection tested")

	collection = client.Database("golang_db").Collection("problems")

	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:5173",
		AllowMethods: "GET,POST,PATCH,DELETE,OPTIONS",
		AllowHeaders: "Content-Type, Accept",
	}))

	app.Get("/api/problems", getProblems)
	app.Post("/api/problems", createProblem)
	app.Patch("/api/problems/:id", updateProblem)
	app.Delete("/api/problems/:id", deleteProblem)

	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}

	log.Fatal(app.Listen("0.0.0.0:" + port))
}

func getProblems(c *fiber.Ctx) error {
	var problems []Problem

	cursor, err := collection.Find(context.Background(), bson.M{})

	if err != nil {
		return err
	}

	defer cursor.Close(context.Background())

	for cursor.Next(context.Background()) {
		var problem Problem
		if err := cursor.Decode(&problem); err != nil {
			return err
		}

		problems = append(problems, problem)
	}

	return c.JSON(problems)
}

func createProblem(c *fiber.Ctx) error {
	var problem Problem

	if err := c.BodyParser(&problem); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	problem.ID = primitive.NewObjectID()
	problem.CreatedTime = time.Now()
	problem.UpdatedTime = time.Now()

	_, err := collection.InsertOne(context.Background(), problem)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to insert problem")
	}

	return c.Status(fiber.StatusCreated).JSON(problem)
}

func updateProblem(c *fiber.Ctx) error {
	idParam := c.Params("id")

	objID, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid id format")
	}

	var updateData bson.M
	if err := c.BodyParser(&updateData); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid update data")
	}

	updateData["updated_time"] = time.Now()

	filter := bson.M{"_id": objID}
	update := bson.M{"$set": updateData}

	_, err = collection.UpdateOne(context.Background(), filter, update)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Update failed")
	}

	return c.SendStatus(fiber.StatusOK)
}

func deleteProblem(c *fiber.Ctx) error {
	idParam := c.Params("id")

	// Convert string id to ObjectID
	objID, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid id format")
	}

	filter := bson.M{"_id": objID}

	_, err = collection.DeleteOne(context.Background(), filter)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Delete failed")
	}

	return c.SendStatus(fiber.StatusOK)
}

// Client-sided API

// func main() {
// 	app := fiber.New()
// 	fmt.Println("hello")

// 	problems := []Problem{}

// 	//fetch problem
// 	app.Get("/api/problems", func(c *fiber.Ctx) error {
// 		return c.JSON(problems)
// 	})

// 	//post problem
// 	app.Post("/api/problems", func(c *fiber.Ctx) error {
// 		problem := &Problem{}

// 		if err := c.BodyParser(problem); err != nil {
// 			return err
// 		}

// 		if problem.Title == "" {
// 			return c.Status(400).JSON(fiber.Map{"error": "Problem Title is required!"})
// 		}

// 		problem.ID = len(problems) + 1
// 		problem.CreatedTime = time.Now()
// 		problem.UpdatedTime = time.Now()
// 		problems = append(problems, *problem)

// 		return c.Status(201).JSON(problem)
// 	})

// 	//update field
// 	app.Patch("/api/problems/:id", func(c *fiber.Ctx) error {
// 		id, err := c.ParamsInt("id")
// 		if err != nil || id <= 0 {
// 			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID"})
// 		}

// 		var updates map[string]interface{}
// 		if err := c.BodyParser(&updates); err != nil {
// 			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
// 		}

// 		for i, p := range problems {
// 			if p.ID == id {
// 				if v, ok := updates["title"].(string); ok {
// 					problems[i].Title = v
// 				}
// 				if v, ok := updates["lc_number"].(float64); ok {
// 					problems[i].LCNumber = int(v)
// 				}
// 				if v, ok := updates["tags"].([]interface{}); ok {
// 					var tags []string
// 					for _, tag := range v {
// 						if str, ok := tag.(string); ok {
// 							tags = append(tags, str)
// 						}
// 					}
// 					problems[i].Tags = tags
// 				}
// 				if v, ok := updates["difficulty"].(string); ok {
// 					problems[i].Difficulty = v
// 				}
// 				if v, ok := updates["solution"].(string); ok {
// 					problems[i].Solution = v
// 				}
// 				if v, ok := updates["notes"].(string); ok {
// 					problems[i].Notes = v
// 				}
// 				if v, ok := updates["completed"].(bool); ok {
// 					problems[i].Completed = v
// 				}
// 				// Update updated time
// 				problems[i].UpdatedTime = time.Now()

// 				return c.JSON(problems[i])
// 			}
// 		}

// 		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Problem not found"})
// 	})

// 	//update problem
// 	app.Put("/api/problems/:id", func(c *fiber.Ctx) error {
// 		id, err := c.ParamsInt("id")
// 		if err != nil || id <= 0 {
// 			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID"})
// 		}

// 		problem := new(Problem)
// 		if err := c.BodyParser(problem); err != nil {
// 			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
// 		}

// 		for i, p := range problems {
// 			if p.ID == id {
// 				problem.ID = id
// 				problem.CreatedTime = p.CreatedTime
// 				problem.UpdatedTime = time.Now()
// 				problems[i] = *problem
// 				return c.JSON(problem)
// 			}
// 		}

// 		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Problem not found"})
// 	})

// 	//delete problem
// 	app.Delete("/api/problems/:id", func(c *fiber.Ctx) error {
// 		id, err := c.ParamsInt("id")
// 		if err != nil || id <= 0 {
// 			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID"})
// 		}
// 		for i, p := range problems {
// 			if p.ID == id {
// 				problems = append(problems[:i], problems[i+1:]...)
// 				return c.SendStatus(fiber.StatusNoContent)
// 			}
// 		}
// 		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Problem not found"})
// 	})

// 	log.Fatal(app.Listen(":4000"))
// }
