import bcrypt from "bcrypt"

export const signUp = async (req, res) => {
  try {
    const { username, password, email, firstname, lastname } = req.body

    if (!username || !password || !email || firstname || !lastname) {
      return res.status(400).json({message: "username, password, email, firstname, lastname is required."})
    }

    // check to see user existing
    const duplicate = await User.findOne({username})
    if (duplicate) {
      return res.status(409).json({ message: "username existed."})
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10) // salt = 10

    // create user
    await User.create({
      username,
      hashedPassword,
      email,
      displayName: `${firstname} ${lastname}`
    })

    // return
    return res.status(204)
  } catch (error) {
    console.log("Error at signup: ", error)
    return res.status(500).json({ message: "System error."})
  }
}