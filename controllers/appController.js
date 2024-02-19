import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import UserModel from '../model/User.model.js';
import otpGenerator from 'otp-generator';


/** middleware for verify user */
export async function verifyUser(req, res, next){
    try {

        const { username } = req.method == "GET" ? req.query : req.body;

        // check the user existance
        let exist = await UserModel.findOne({ username });
        if(!exist) return res.status(404).send({ error : "Can't find User!"});
        next();

    } catch (error) {
        return res.status(404).send({ error: "Authentication Error"});
    }
    
}


/** POST: http://localhost:5000/api/register 
 * @param : {
  "username" : "example123",
  "password" : "admin123",
  "email": "example@gmail.com",
  "firstName" : "bill",
  "lastName": "william",
  "mobile": 8009860560,
  "address" : "Apt. 556, Kulas Light, Gwenborough",
  "profile": ""
}
*/
export async function register(req, res) {
    const {
        username,
        email,
        password,
        profile
    } = req.body;
    if (!username && username.trim() === ""
        && !username && username.trim() === ""
        && !password && password.trim() === "") {
        message: "Invalid inputs"
        return res.status(422).send({
        })
    }
    let existingUsername;
    try {
        existingUsername = await UserModel.findOne({ username });
    } catch (err) {
        return console.log(err)
    }
    if (existingUsername) {
        return res.status(500).send({
            msg: "user already exist"
        })
    }
    let existingEmail;
    try {
        existingEmail = await UserModel.findOne({ email });
    } catch (err) {
        return console.log(err)
    }
    if (existingEmail) {
        return res.status(500).send({
            msg: "user already exist"
        })
    }
     const salt = bcrypt.genSaltSync(10)
    const hashedPassword = bcrypt.hashSync(password, salt)

    let newUser;
    try {
        newUser = new UserModel({
            username,
            email,
            password: hashedPassword,
            profile: profile
        });
        newUser = await newUser.save()
    } catch (err) { return console.log(err) }
    if (!newUser) {
        return res.status(500).send({ message: "unexpected error occured" })

    }
    return res.status(201).send({
        newUser,
        msg:'User Succefully Register',
        status: true
    })

}


/** POST: http://localhost:5000/api/login 
 * @param: {
  "username" : "example123",
  "password" : "admin123"
}
*/
export async function login(req, res, next) {

    const { username, password } = req.body

    let existingUser;
    try {
        existingUser = await UserModel.findOne({ username });
        if (!existingUser) {
            return res.status(500).json({
                message: "Account is not valid"
            })
        }
        next();
    } catch (err) {
        return console.log(err)
    }



    const ispasswordcorrect = bcrypt.compareSync(password, existingUser.password);
    if (!ispasswordcorrect) {
        return res.status(400).json({
            message: "password is not valid"
        })
    }
    const token = jwt.sign({ id: existingUser._id }, process.env.SECRET_KEY, {
        expiresIn: "7d",
    })
    return res.status(200).json({
        message: "Login successfully",
        token,
        username: existingUser.username,
        status:true,
    })

}


/** GET: http://localhost:5000/api/user/example123 */
export async function getUser(req, res) {

    try {
        const { username } = req.params;
        const user = await UserModel.findOne({ username }).select('-password'); // Exclude the password field
    
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
    
        // Return the user object without the password field
        res.status(200).json(user);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
      }

}


export async function updateUser(req, res, next) {
    // const id = req.query.id;
    const {id} = req.user;
    const {
                username,
                password,
                email,
                firstName,
                lastName,
                mobile,
                address,
                profile,
    } = req.body;
    
    
    let user;
    try {
        user = await UserModel.findByIdAndUpdate({_id:id}, { username, email, password,firstName,
            lastName,
            mobile,
            address,
            profile })
    } catch (err) {
        return console.log(err)
    }
    if (!user) {
        res.status(500).json({
            message: "Something Went Wrong"
        })
    }
    return res.status(201).json({
        message: "Updated Successfully"
    })
    
}


/** GET: http://localhost:5000/api/generateOTP */
export async function generateOTP(req, res) {
    req.app.locals.OTP = await otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false })
    res.status(201).send({ code: req.app.locals.OTP })
}


/** GET: http://localhost:5000/api/verifyOTP */
export async function verifyOTP(req, res) {
    const { code } = req.query;
    if (parseInt(req.app.locals.OTP) === parseInt(code)) {
        req.app.locals.OTP = null; // reset the OTP value
        req.app.locals.resetSession = true; // start session for reset password
        return res.status(201).send({ msg: 'Verify Successsfully!' })
    }
    return res.status(400).send({ error: "Invalid OTP" });
}


// successfully redirect user when OTP is valid  
/** GET: http://localhost:5000/api/createResetSession */
export async function createResetSession(req, res) {
    if (req.app.locals.resetSession) {
        return res.status(201).send({ flag: req.app.locals.resetSession })
    }
    return res.status(440).send({ error: "Session expired!" })
}


// update the password when we have valid session
/** PUT: http://localhost:5000/api/resetPassword */
export async function resetPassword(req, res) {
    try {

        if (!req.app.locals.resetSession) return res.status(440).send({ error: "Session expired!" });

        const { username, password } = req.body;

        try {

            UserModel.findOne({ username })
                .then(user => {
                    bcrypt.hash(password, 10)
                        .then(hashedPassword => {
                            UserModel.updateOne({ username: user.username },
                                { password: hashedPassword }, function (err, data) {
                                    if (err) throw err;
                                    req.app.locals.resetSession = false; // reset session
                                    return res.status(201).send({ msg: "Record Updated...!" })
                                });
                        })
                        .catch(e => {
                            return res.status(500).send({
                                error: "Enable to hashed password" 
                            })
                        })
                })
                .catch(error => {
                    return res.status(404).send({ error: "Username not Found" });
                }) 

        } catch (error) {
            return res.status(500).send({ error })
        }

    } catch (error) {
        return res.status(401).send({ error })
    }
} 