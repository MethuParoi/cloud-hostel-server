const { ObjectId } = require("mongodb");

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");

module.exports = (db) => {
  const mealCollection = db.collection("mealCollection");

  // Add meal
  router.post("/add-meal", verifyToken, async (req, res) => {
    try {
      const newFood = req.body;
      const result = await mealCollection.insertOne(newFood);
      res.send(result);
    } catch (error) {
      res.status(500).send({ error: "Failed to add meal" });
    }
  });

  // Add liked meal
  router.post("/add-liked-meal", verifyToken, async (req, res) => {
    try {
      const newFood = req.body;
      newFood._id = new ObjectId(newFood._id);
      const result = await mealCollection.insertOne(newFood);
      res.send(result);
    } catch (error) {
      res.status(500).send({ error: "Failed to add meal" });
    }
  });

  // Get meals
  router.get("/get-featured-meal", async (req, res) => {
    try {
      const mealType = req.query.mealType;
      const query = mealType && mealType !== "all" ? { mealType } : {};
      const meals = await mealCollection.find(query).toArray();
      res.send(meals);
    } catch (error) {
      res.status(500).send({ error: "Failed to fetch meal" });
    }
  });

  // Get single meal details
  router.get("/get-meal-details/:id", verifyToken, async (req, res) => {
    try {
      const id = req.params.id;

      // Validate if the ID is a valid ObjectId
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: "Invalid meal ID format" });
      }

      const objectId = new ObjectId(id);
      const query = { _id: objectId };

      const meal = await mealCollection.findOne(query);

      if (!meal) {
        return res.status(404).send({ error: "Meal not found" });
      }

      res.send(meal);
    } catch (error) {
      console.error("Error fetching meal details:", error); // Log for debugging
      res.status(500).send({ error: "Failed to fetch meal details" });
    }
  });

  //update a meal
  router.patch("/update-meal/:id", verifyToken, async (req, res) => {
    const id = req.params.id;
    // Convert id to ObjectId
    const objectId = new ObjectId(id);
    const updatedMeal = req.body;
    const result = await mealCollection.updateOne(
      { _id: objectId },
      { $set: updatedMeal }
    );
    res.send(result);
  });

  // Delete a meal

  router.delete("/delete-meal/:id", verifyToken, async (req, res) => {
    const id = req.params.id;
    // Convert id to ObjectId
    const objectId = new ObjectId(id);
    const result = await mealCollection.deleteOne({ _id: objectId });
    res.send(result);
  });

  // Search meals by title
  router.get("/search-meals", async (req, res) => {
    try {
      const { query } = req.query; // Get the search query from query parameters

      if (!query || query.trim() === "") {
        return res.status(400).send({ error: "Search query is required" });
      }

      const searchRegex = new RegExp(query, "i"); // Case-insensitive regex for partial matching
      const searchQuery = {
        $or: [
          {
            title: { $regex: searchRegex },
          },
          // { email: { $regex: searchRegex } },
        ],
      };

      const meals = await mealCollection.find(searchQuery).toArray();

      if (meals.length === 0) {
        return res.status(404).send({ message: "No meals found" });
      }

      res.send({ meals });
    } catch (error) {
      console.error("Error searching meals:", error);
      res.status(500).send({ error: "Failed to search meals" });
    }
  });

  //filter meals by category
  router.get("/filter-meals", async (req, res) => {
    try {
      const { category } = req.query;

      if (!category || category.trim() === "") {
        return res.status(400).send({ error: "Category is required" });
      }

      const searchQuery = {
        mealType: category,
      };

      const meals = await mealCollection.find(searchQuery).toArray();

      if (meals.length === 0) {
        return res.status(404).send({ message: "No meals found" });
      }

      res.send({ meals });
    } catch (error) {
      console.error("Error filtering meals:", error);
      res.status(500).send({ error: "Failed to filter meals" });
    }
  });

  //filter meals by price range
  router.get("/filter-meals-by-price", async (req, res) => {
    try {
      const { minPrice, maxPrice } = req.query;

      if (!minPrice || !maxPrice) {
        return res.status(400).send({ error: "Price range is required" });
      }

      const searchQuery = {
        price: { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) },
      };

      const meals = await mealCollection.find(searchQuery).toArray();

      if (meals.length === 0) {
        return res.status(404).send({ message: "No meals found" });
      }

      res.send({ meals });
    } catch (error) {
      console.error("Error filtering meals by price:", error);
      res.status(500).send({ error: "Failed to filter meals by price" });
    }
  });

  //increase like count
  router.patch("/increase-like/:id", verifyToken, async (req, res) => {
    const id = req.params.id;
    // Convert id to ObjectId
    const objectId = new ObjectId(id);
    const meal = await mealCollection.findOne({ _id: objectId });
    const updatedMeal = { ...meal, likes: meal.likes + 1 };
    const result = await mealCollection.updateOne(
      { _id: objectId },
      { $set: updatedMeal }
    );
    res.send(result);
  });

  //increase review count
  router.patch("/increase-review/:id", verifyToken, async (req, res) => {
    const id = req.params.id;
    // Convert id to ObjectId
    const objectId = new ObjectId(id);
    const meal = await mealCollection.findOne({ _id: objectId });
    const updatedMeal = { ...meal, reviewsCount: meal.reviewsCount + 1 };
    const result = await mealCollection.updateOne(
      { _id: objectId },
      { $set: updatedMeal }
    );
    res.send(result);
  });

  //-------------------------Upcoming Meals--------------------------------

  const upcomingMealCollection = db.collection("upcomingMealCollection");

  // Add upcoming meal
  router.post("/add-upcoming-meal", verifyToken, async (req, res) => {
    try {
      const newUpcomingMeal = req.body;
      const result = await upcomingMealCollection.insertOne(newUpcomingMeal);
      res.send(result);
    } catch (error) {
      res.status(500).send({ error: "Failed to add upcoming meal" });
    }
  });

  //update a new data to upcoming meals
  router.patch("/update-upcoming-meal/:id", verifyToken, async (req, res) => {
    try {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const update = { $set: { isPublished: true } };
      const result = await upcomingMealCollection.updateOne(query, update);
      res.send(result);
    } catch (error) {
      res.status(500).send({ error: "Failed to update" });
    }
  });

  //get upcoming meals
  router.get("/get-upcoming-meals", async (req, res) => {
    try {
      const upcomingMeals = await upcomingMealCollection.find({}).toArray();
      res.send(upcomingMeals);
    } catch (error) {
      res.status(500).send({ error: "Failed to fetch upcoming meals" });
    }
  });

  //get single upcoming meal details
  router.get(
    "/get-upcoming-meal-details/:id",
    verifyToken,
    async (req, res) => {
      try {
        const id = req.params.id;
        const objectId = new ObjectId(id);
        const query = { _id: objectId };
        const upcomingMeal = await upcomingMealCollection.findOne(query);
        if (!upcomingMeal) {
          return res.status(404).send({ error: "Upcoming meal not found" });
        }
        res.send(upcomingMeal);
      } catch (error) {
        console.error("Error fetching upcoming meal details:", error);
        res
          .status(500)
          .send({ error: "Failed to fetch upcoming meal details" });
      }
    }
  );

  //increase like count
  router.patch(
    "/increase-upcoming-meal-like/:id",
    verifyToken,
    async (req, res) => {
      const id = req.params.id;
      // Convert id to ObjectId
      const objectId = new ObjectId(id);
      const meal = await upcomingMealCollection.findOne({ _id: objectId });
      const updatedMeal = { ...meal, likes: meal.likes + 1 };
      const result = await upcomingMealCollection.updateOne(
        { _id: objectId },
        { $set: updatedMeal }
      );
      res.send(result);
    }
  );

  return router;
};
