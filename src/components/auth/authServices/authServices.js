const { User } = require('../../../models/users');
const JWTService = require('../../../utils/jwt/jwt');
const { createHash, isValidPassword } = require('../../../utils/bcrypt/bcrypt');
const { Cart } = require('../../../models/carts');
const { config } = require('../../../config');
const { cartsServices } = require('../../../repositories/index');
const { usersServices } = require('../../../repositories/index');

class AuthServices {
  register = async (payload, res) => {
    try {
      const { first_name, last_name, email, age, password } = payload;

      if (!first_name || !last_name || !email || !age || !password) {
        return res.sendServerError('Missing required fields');
      }
      const existingUser = await usersServices.findOne({ email: email });

      if (existingUser) {
        return res.sendUserError('There is already a user with the same email');
      }
      const newUser = new User({
        first_name,
        last_name,
        email,
        age,
        password: createHash(password),
      });
      const savedUser = await usersServices.createUserDTO(newUser);
      const userCart = new Cart({
        user: savedUser._id,
        products: [],
      });
      await cartsServices.save(userCart);

      savedUser.cart = userCart._id;
      await savedUser.save();

      const data = newUser;
      const token = await JWTService.generateJwt({ id: savedUser._id });

      return res.sendCreated({
        payload: {
          message: 'User added successfully',
          token,
          data,
        },
      });
    } catch (error) {
      return res.sendServerError('Error adding user');
    }
  };
  login = async ({ email, password, isAdminLogin }) => {
    try {
      if (isAdminLogin) {
        const adminUser = {
          email: config.admin_email,
          admin: true,
          role: 'admin',
        };
        return { status: 200, success: true, response: adminUser, isAdminLogin: true };
      } else {
        let user = await usersServices.findOne({
          email: email,
        });
        if (!user) {
          return { status: 401, success: false, response: 'User does not exist in the database' };
        }
        if (!isValidPassword(password, user)) {
          return { status: 403, success: false, response: 'Invalid Credentials' };
        }
        return { status: 200, success: true, response: user, isAdminLogin: false };
      }
    } catch (error) {
      return { status: 500, success: false, response: 'Server Error' };
    }
  };
  logout = async (req, res) => {
    try {
      res.clearCookie('jwt');
      await new Promise((resolve, reject) => {
        req.session.destroy((err) => {
          if (err) {
            const response = { status: 500, success: false, error: err };
            req.logoutResult = response;
            reject(response);
          } else {
            const response = { status: 200, success: true, message: 'Successful logout' };
            req.logoutResult = response;
            resolve(response);
          }
        });
      });
      return req.logoutResult;
    } catch (err) {
      const response = { status: 500, success: false, error: 'Error during log out' };
      req.logoutResult = response;
      return response;
    }
  };
}
module.exports = new AuthServices();
