exports.allAccess = (req, res) => {
    res.status(200).send("Public Content.");
};
  
exports.normalBoard = (req, res) => {
    res.status(200).send("Normal Content.");
};
  
exports.adminBoard = (req, res) => {
    res.status(200).send("Admin Content.");
};
  