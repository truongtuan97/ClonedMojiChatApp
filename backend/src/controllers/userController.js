export const authMe = async (req, res) => {
  try {
    const user = req.user; // user get from middleware
    return res.status(200).json({user});
  } catch (error) {
    console.log("Error at authMe: ", error)
    return res.status(500).json({
      message: "System error."
    });
  }
}