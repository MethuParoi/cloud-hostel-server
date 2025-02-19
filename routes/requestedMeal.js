const express = require("express");
const { ObjectId } = require("mongodb");
const verifyToken = require("../middleware/verifyToken");
const router = express.Router();

module.exports = (db) => {
  const requestedMealCollection = db.collection("requestedMealCollection");
  // Add requested meal
  router.post("/add-requested-meal", verifyToken, async (req, res) => {
    try {
      const { id, user, status, name } = req.body;

      if (!id || !user || !status || !name) {
        return res.status(400).send({ error: "ID and user are required" });
      }

      const newReqMeal = { id, user, status, name };

      // Upsert logic to create or update the requestedMealCollection
      const result = await requestedMealCollection.updateOne(
        {}, // Use an empty filter to target the collection-level document
        { $push: { meals: newReqMeal } }, // Push the new requested meal into the "meals" array
        { upsert: true } // Create the document if it doesn't exist
      );

      res.send({ message: "Meal added successfully", result });
    } catch (error) {
      console.error("Error adding requested meal:", error);
      res.status(500).send({ error: "Failed to add requested meal" });
    }
  });

  // Get requested-meal
  router.get("/get-requested-meal", verifyToken, async (req, res) => {
    try {
      const reviews = await requestedMealCollection.find({}).toArray();
      res.send(reviews);
    } catch (error) {
      res.status(500).send({ error: "Failed to fetch reviews" });
    }
  });

  //update status of requested meal
  router.put(
    "/update-requested-meal-status/:id",
    verifyToken,
    async (req, res) => {
      try {
        const { id } = req.params;
        const { status } = req.body;

        if (!id || !status) {
          return res.status(400).send({ error: "ID and status are require" });
        }

        // Update the requested meal with the specified ID
        const result = await requestedMealCollection.updateOne(
          { "meals.id": id }, // Find the requested meal where `id` matches
          { $set: { "meals.$.status": status } } // Update the status of the found meal
        );

        if (result.modifiedCount === 0) {
          return res
            .status(404)
            .send({ error: "Meal not found or already updated" });
        }

        res.send({ message: "Meal status updated successfully", result });
      } catch (error) {
        console.error("Error updating requested meal status:", error);
        res
          .status(500)
          .send({ error: "Failed to update requested meal status" });
      }
    }
  );

  // Delete requested meal
  router.delete("/delete-requested-meal/:id", verifyToken, async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).send({ error: "Meal ID is required" });
      }

      // Remove the meal with the specified ID from the "meals" array
      const result = await requestedMealCollection.updateOne(
        {}, // Use an empty filter to target the collection-level document
        { $pull: { meals: { id } } } // Remove the meal where `id` matches
      );

      if (result.modifiedCount === 0) {
        return res
          .status(404)
          .send({ error: "Meal not found or already deleted" });
      }

      res.send({ message: "Meal deleted successfully", result });
    } catch (error) {
      console.error("Error deleting requested meal:", error);
      res.status(500).send({ error: "Failed to delete requested meal" });
    }
  });

  return router;
};
