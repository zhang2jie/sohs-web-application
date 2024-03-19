import Test from "@/model/Test";
import Worker from "@/model/Worker";
import connectDB from "@/utils/connectDB";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      await connectDB();

      // Fetch all workers from the database
      let workers;
      if (req.query.fin) {
        workers = await Worker.find({ fin: req.query.fin });
      } else {
        let query = {};

        if (req.query.q) {
          query.$or = [
            { name: { $regex: req.query.q, $options: "i" } },
            { fin: { $regex: req.query.q, $options: "i" } },
          ];
        }
        workers = await Worker.find(query);
      }

      const updatedWorkers = await Promise.all(
        workers.map(async (worker) => {
          const test = await Test.findOne({ fin: worker.fin });

          const previousResultData =
            worker?.previous_result !== ""
              ? worker?.previous_result
              : test?.previous_result;

          return {
            ...worker.toObject(),
            previous_result: previousResultData ? previousResultData : "",
          };
        })
      );

      return res.status(200).json({ success: true, data: updatedWorkers });
    } catch (error) {
      console.error("Error:", error.message); // Log the specific error message
      return res.status(500).json({ error: "Failed to fetch data" });
    }
  } else {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
}
