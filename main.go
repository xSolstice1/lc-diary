package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Username string             `bson:"username" json:"username"`
	Password string             `bson:"password,omitempty" json:"password"`
}

type Problem struct {
	ID          primitive.ObjectID `json:"id,omitempty" bson:"_id,omitempty"`
	UserID      primitive.ObjectID `json:"user_id,omitempty" bson:"user_id,omitempty"`
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
var collectionUser *mongo.Collection
var jwtSecret = []byte(os.Getenv("JWT_SECRET"))

const GuestUserIDHex = "000000000000000000000000"

func main() {
	if err := godotenv.Load(".env"); err != nil {
		log.Println("No .env file found, using environment variables")
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
	collectionUser = client.Database("golang_db").Collection("users")

	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:5173,https://lc-diary-production.up.railway.app,https://lc-diary.vercel.app/",
		AllowMethods: "GET,POST,PATCH,DELETE,OPTIONS",
		AllowHeaders: "Content-Type, Accept, Authorization",
	}))

	problemsGroup := app.Group("/api/problems", jwtMiddleware)
	problemsGroup.Get("/", getProblems)
	problemsGroup.Post("/", createProblem)
	problemsGroup.Patch("/:id", updateProblem)
	problemsGroup.Delete("/:id", deleteProblem)
	app.Post("/api/signup", signup)
	app.Post("/api/login", login)
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}

	log.Fatal(app.Listen("0.0.0.0:" + port))
}

func getProblems(c *fiber.Ctx) error {
	userIDValue := c.Locals("user_id")

	var userID primitive.ObjectID
	var err error

	if userIDValue == nil {
		// No user_id found, assign guest ID
		userID, err = getGuestUserID()
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, "Failed to get guest user ID")
		}
	} else {
		userIDStr, ok := userIDValue.(string)
		if !ok {
			return fiber.NewError(fiber.StatusInternalServerError, "User ID is not a string")
		}
		userID, err = primitive.ObjectIDFromHex(userIDStr)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, "Invalid user ID")
		}
	}

	// Query using userID
	cursor, err := collection.Find(context.Background(), bson.M{"user_id": userID})
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to fetch problems")
	}
	defer cursor.Close(context.Background())

	var problems []Problem
	for cursor.Next(context.Background()) {
		var problem Problem
		if err := cursor.Decode(&problem); err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, "Error decoding problem")
		}
		problems = append(problems, problem)
	}
	if err := cursor.Err(); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Cursor error")
	}

	return c.JSON(problems)
}

func getGuestUserID() (primitive.ObjectID, error) {
	guestIDHex := "000000000000000000000000"
	return primitive.ObjectIDFromHex(guestIDHex)
}

func createProblem(c *fiber.Ctx) error {
	var problem Problem

	if err := c.BodyParser(&problem); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	userIDValue := c.Locals("user_id")

	var userID primitive.ObjectID
	var err error

	if userIDValue == nil {
		// assign guest user ID or return error
		userID, err = getGuestUserID()
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, "Failed to get guest user ID")
		}
	} else {
		userIDStr, ok := userIDValue.(string)
		if !ok {
			return fiber.NewError(fiber.StatusInternalServerError, "User ID is not a string")
		}
		userID, err = primitive.ObjectIDFromHex(userIDStr)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, "Invalid user ID")
		}
	}

	problem.UserID = userID
	problem.ID = primitive.NewObjectID()
	problem.CreatedTime = time.Now()
	problem.UpdatedTime = time.Now()
	fmt.Println("UserID from locals:", userIDValue)

	_, err = collection.InsertOne(context.Background(), problem)
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

	userIDValue := c.Locals("user_id")
	var userID primitive.ObjectID
	if userIDValue == nil {
		userID, err = getGuestUserID()
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, "Failed to get guest user ID")
		}
	} else {
		userIDStr, ok := userIDValue.(string)
		if !ok {
			return fiber.NewError(fiber.StatusInternalServerError, "User ID is not a string")
		}
		userID, err = primitive.ObjectIDFromHex(userIDStr)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, "Invalid user ID")
		}
	}

	var updateData bson.M
	if err := c.BodyParser(&updateData); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid update data")
	}

	filter := bson.M{"_id": objID, "user_id": userID} // <- ensure ownership
	updateData["updated_time"] = time.Now()           // update timestamp

	update := bson.M{"$set": updateData}

	result, err := collection.UpdateOne(context.Background(), filter, update)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Update failed")
	}

	if result.MatchedCount == 0 {
		return fiber.NewError(fiber.StatusForbidden, "No problem found or you don't have permission to update")
	}

	return c.SendStatus(fiber.StatusOK)
}

func deleteProblem(c *fiber.Ctx) error {
	idParam := c.Params("id")

	objID, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid id format")
	}

	userIDValue := c.Locals("user_id")
	var userID primitive.ObjectID
	if userIDValue == nil {
		userID, err = getGuestUserID()
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, "Failed to get guest user ID")
		}
	} else {
		userIDStr, ok := userIDValue.(string)
		if !ok {
			return fiber.NewError(fiber.StatusInternalServerError, "User ID is not a string")
		}
		userID, err = primitive.ObjectIDFromHex(userIDStr)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, "Invalid user ID")
		}
	}

	filter := bson.M{"_id": objID, "user_id": userID} // <- restrict delete by owner

	result, err := collection.DeleteOne(context.Background(), filter)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Delete failed")
	}

	if result.DeletedCount == 0 {
		return fiber.NewError(fiber.StatusForbidden, "No problem found or you don't have permission to delete")
	}

	return c.SendStatus(fiber.StatusOK)
}

func signup(c *fiber.Ctx) error {
	var user User

	body := c.Body()
	fmt.Println("Raw body:", string(body))
	if err := c.BodyParser(&user); err != nil {
		fmt.Println("Error parsing body:", err)
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	// Check if user exists
	count, err := collectionUser.CountDocuments(context.Background(), bson.M{"username": user.Username})
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Database error")
	}
	if count > 0 {
		return fiber.NewError(fiber.StatusConflict, "User already exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Could not hash password")
	}
	user.Password = string(hashedPassword)
	user.ID = primitive.NewObjectID()

	_, err = collectionUser.InsertOne(context.Background(), user)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to create user")
	}

	return c.SendStatus(fiber.StatusCreated)
}

func login(c *fiber.Ctx) error {
	var input User
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	var user User
	err := collectionUser.FindOne(context.Background(), bson.M{"username": input.Username}).Decode(&user)
	if err != nil {
		return fiber.NewError(fiber.StatusUnauthorized, "Invalid username or password")
	}

	// Check password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password))
	if err != nil {
		return fiber.NewError(fiber.StatusUnauthorized, "Invalid username or password")
	}

	// Create JWT token
	claims := jwt.MapClaims{
		"user_id": user.ID.Hex(),
		"exp":     time.Now().Add(time.Hour * 72).Unix(), // Token expiry
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, err := token.SignedString(jwtSecret)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to create token")
	}

	return c.JSON(fiber.Map{
		"token": tokenStr,
	})
}

func jwtMiddleware(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		return fiber.ErrUnauthorized
	}

	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		return fiber.ErrUnauthorized
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return fiber.ErrUnauthorized
	}

	userID, ok := claims["user_id"].(string)
	if !ok {
		return fiber.ErrUnauthorized
	}

	c.Locals("user_id", userID)
	return c.Next()
}
