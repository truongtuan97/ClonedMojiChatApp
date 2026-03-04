import bcrypt from "bcrypt"
import User from './../models/User.js'
import jwt from "jsonwebtoken"
import crypto from 'crypto'
import Session from './../models/Session.js'

const ACCESS_TOKEN_TTL = '30m'
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;

export const signUp = async (req, res) => {
  try {
    const {
      username,
      password,
      email,
      firstname,
      lastname
    } = req.body

    if (!username || !password || !email || !firstname || !lastname) {
      return res.status(400).json({
        message: "username, password, email, firstname, lastname is required."
      })
    }

    // check to see user existing
    const duplicate = await User.findOne({
      username
    })
    if (duplicate) {
      return res.status(409).json({
        message: "username existed."
      })
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
    return res.sendStatus(204)
  } catch (error) {
    console.log("Error at signup: ", error)
    return res.status(500).json({
      message: "System error."
    })
  }
}

export const signIn = async (req, res) => {
  try {
    // get inputs
    const {
      username,
      password
    } = req.body
    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required."
      })
    }
    // get hashedPassword in db compared with password input
    const user = await User.findOne({
      username
    })
    if (!user) {
      return res.status(401).json({
        message: "Username or password does not match."
      })
    }
    const passwordCorrect = await bcrypt.compare(password, user.hashedPassword)
    if (!passwordCorrect) {
      return res.status(401).json({
        message: "username or password does not match."
      })
    }

    // matched, create accessToken with JWT
    const accessToken = jwt.sign({
      userId: user._id
    }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_TTL
    })
    // create refresh token
    const refreshToken = crypto.randomBytes(64).toString('hex')

    // create new seesion to save refresh token
    await Session.create({
      userId: user._id,
      refreshToken: refreshToken,
      expiredAt: new Date(Date.now() + REFRESH_TOKEN_TTL)
    })

    // return refreshToken to cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none', // case backend and frontend deploy rieng
      maxAge: REFRESH_TOKEN_TTL
    })

    // return accesstoken to response
    return res.status(200).json({
      message: `User ${user.displayName} logged in.`,
      accessToken
    })
  } catch (error) {
    console.log("Error at signIn: ", error)
    return res.status(500).json({
      message: "System error."
    })
  }
}

export const signOut = async (req, res) => {
  try {
    // get refreshToken from cookie
    const token = req.cookies?.refreshToken
    if (token) {
      // delete refreshToken in Session
      await Session.deleteOne({refreshToken: token})
      // delete cookie
      res.clearCookie('refreshToken')
    }
    return res.sendStatus(204)
  } catch (error) {
    console.log("Error at signOut: ", error)
    return res.status(500).json({
      message: "System error."
    })
  }
}