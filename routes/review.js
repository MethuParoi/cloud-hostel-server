const express = require("express");
const { ObjectId } = require("mongodb");
const verifyToken = require("../middleware/verifyToken");
const router = express.Router();

module.exports = (db) => {
  const reviewCollection = db.collection("reviewCollection");
  // Add review
  router.post("/add-review/:id", verifyToken, async (req, res) => {
    try {
      const id = req.params.id;
      const newReview = req.body;
      const query = { _id: new ObjectId(id) };
      const update = { $push: { reviews: newReview } };
      const result = await reviewCollection.updateOne(query, update, {
        upsert: true,
      });
      res.send(result);
    } catch (error) {
      console.error("Error adding review:", error);
      res.status(500).send({ error: "Failed to add review" });
    }
  });

  // Get reviews
  router.get("/get-reviews", verifyToken, async (req, res) => {
    try {
      const reviews = await reviewCollection.find({}).toArray();
      res.send(reviews);
    } catch (error) {
      res.status(500).send({ error: "Failed to fetc reviews" });
    }
  });

  // delete review
  router.delete(
    "/delete-review/:user_id/:review_id",
    verifyToken,
    async (req, res) => {
      try {
        const { user_id, review_id } = req.params; // Extract user_id and review_id from URL

        const result = await reviewCollection.updateOne(
          { "reviews.review.user_id": user_id }, // Match the document where the user_id exists
          { $pull: { "reviews.$[].review": { meal_id: review_id } } } // Remove the specific review by _id
        );

        if (result.modifiedCount === 0) {
          return res
            .status(404)
            .send({ error: "Review not found or not authorized to delete" });
        }

        res.send({ message: "Review deleted successfully" });
      } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).send({ error: "Failed to delete review" });
      }
    }
  );

  return router;
};
