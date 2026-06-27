const installService = require("../services/install.service");
const { APIError } = require("../middlewares/error");

const installController = {
  installDatabase: async (req, res, next) => {
    try {
      if (
        String(process.env.ENABLE_INSTALL_ROUTE || "").toLowerCase() !== "true"
      ) {
        throw new APIError(
          "Install route is disabled. Set ENABLE_INSTALL_ROUTE=true to enable it.",
          403,
          "INSTALL_ROUTE_DISABLED",
        );
      }

      const result = await installService.installDatabase();
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = installController;
