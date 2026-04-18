import { clerkClient, getAuth } from "@clerk/express";

export const auth = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await clerkClient.users.getUser(userId);

    const privateMetadata = user.privateMetadata || {};

    const free_usage = privateMetadata.free_usage || 0;
    const plan = privateMetadata.plan || "free";

    req.userId = userId;
    req.free_usage = free_usage;
    req.plan = plan;

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};