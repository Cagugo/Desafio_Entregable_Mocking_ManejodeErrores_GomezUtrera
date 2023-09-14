const { User } = require('../../../models/users');
const { Cart } = require('../../../models/carts');
const { createHash } = require('../../../utils/bcrypt/bcrypt');
const { usersServices } = require('../../../repositories/index');
const { cartsServices } = require('../../../repositories/index');
const CustomError = require('../../../utils/errors/services/customError');
const EErrors = require('../../../utils/errors/services/enums');
const { generateUserErrorInfo } = require('../../../utils/errors/services/info');

class UsersServices {
  getUsers = async (res) => {
    try {
      const users = await usersServices.findAll();
      const data = users;
      return res.sendSuccess({ message: 'Todos los usuarios', payload: data });
    } catch (error) {
      return res.sendServerError('Error al obtener los usuarios');
    }
  };
  addUser = async (payload, res) => {
    try {
      const { first_name, last_name, age, email, password } = payload;
      if (!first_name || !last_name || !email) {
        console.log('entra al bloque');
        try {
          CustomError.createError({
            name: 'User creation error',
            cause: generateUserErrorInfo({ first_name, last_name, age, email, password }),
            message: 'Error Trying to create User',
            code: EErrors.INVALID_TYPES_ERROR,
          });
        } catch (error) {
          console.error('Ocurrió un error en CustomError:', error);
        }
        return res.sendServerError('Faltan campos obligatorios del Usuario');
      }
      const existingUser = await usersServices.findOne({ email: email });

      if (existingUser) {
        return res.sendUserError('Ya existe un usuario con el mismo correo electrónico');
      }
      const newUser = new User({
        first_name,
        last_name,
        email,
        age,
        password: createHash(password),
      });
      await usersServices.save(newUser);

      const userCart = new Cart({
        user: newUser._id,
        products: [],
      });
      await cartsServices.save(userCart);

      newUser.cart = userCart._id;

      const data = newUser;

      return res.sendCreated({ message: 'Usuario agregado correctamente', payload: data });
    } catch (error) {
      return res.sendServerError('Error al agregar el usuario');
    }
  };
  recoveryUser = async ({ email, password, res }) => {
    try {
      let user = await usersServices.findOne({
        email: email,
      });
      if (!user) {
        return res.sendUnauthorized('El usuario no existe en la base de datos');
      }
      let data = await usersServices.findByIdAndUpdate(user._id, { password: createHash(password) }, { new: true });

      return res.sendSuccess({ message: 'Contraseña actualizada correctamente', payload: data });
    } catch (error) {
      return res.sendServerError('Error al recuperar la contraseña');
    }
  };
  getUserById = async (uid, res) => {
    try {
      const user = await usersServices.findById(uid);

      if (!user) {
        return res.sendNotFound('Usuario no encontrado');
      }
      const data = user;

      return res.sendSuccess({ message: 'Usuario obtenido correctamente', payload: data });
    } catch (error) {
      return res.sendServerError('Error al obtener el usuario');
    }
  };
  updateUser = async (uid, updateFields, res, req) => {
    try {
      const allowedFields = ['first_name', 'last_name', 'email', 'age', 'password', 'role'];

      const invalidFields = Object.keys(updateFields).filter((field) => !allowedFields.includes(field));

      if (invalidFields.length > 0) {
        return res.sendUserError(`Los siguientes campos no se pueden modificar: ${invalidFields.join(', ')}`);
      }
      const updatedUser = await usersServices.findByIdAndUpdate(uid, updateFields, { new: true });

      if (!updatedUser) {
        return res.sendNotFound('Usuario no encontrado');
      }
      req.app.io.emit('updateUser', updatedUser);

      const data = updatedUser;

      return res.sendSuccess({ message: 'Usuario actualizado correctamente', payload: data });
    } catch (error) {
      return res.sendServerError('Error al actualizar el usuario');
    }
  };
  deleteUser = async (uid, res, req) => {
    try {
      const deletedUser = await usersServices.findByIdAndDelete(uid);

      if (!deletedUser) {
        return res.sendNotFound('Usuario no encontrado');
      }
      req.app.io.emit('deleteUser', uid);
      const data = deletedUser;
      return res.sendSuccess({ message: 'Usuario eliminado correctamente', payload: data });
    } catch (error) {
      return res.sendServerError('Error al eliminar el usuario');
    }
  };
}
module.exports = new UsersServices();
