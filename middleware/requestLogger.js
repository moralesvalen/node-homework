module.exports = (req, res, next) => {
  res.on("finish", () => {
    // Here you'd log information that might be helpful to know
    //  about the req and/or the res.
    console.log("==== Request Completed ====");
    console.log("Method:", req.method);
    console.log("Path:", req.path);
    console.log("Query:", req.query);
    console.log("Status Code:", res.statusCode);
    console.log("============================\n");
  });

  next();
};
