const { response } = require("express");
const Usuario = require("../models/Usuario");
const bcrypt = require("bcryptjs");
const { generarJWT } = require("../helpers/jwt");

//crearUsuario
const crearUsuario = async(req, res = response) => {

    const { email, name, password } = req.body;

    try {
        //Verificar el email
        const usuario = await Usuario.findOne({email});

        if(usuario) {
            return res.status(400).json({
                ok: false,
                msg: "Usuario con ese email, ya existe."
            });
        }

        //Crear usuario con el modelo
        const dbUser = new Usuario(req.body);

        //Hashear(encriptar) la contraseña
        const salt = bcrypt.genSaltSync();
        dbUser.password = bcrypt.hashSync(password, salt);

        //Generar el JsonWebToken(JWT)
        const token = await generarJWT(dbUser.id, name);

        //Crear usuario de DB
        await dbUser.save();

        //Generar respuesta exitosa
        return res.status(200).json({
            ok: true,
            uid: dbUser.id,
            name,
            token
        });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: "Por favor hable con el administrador"
        });
    }
};

//loginUsuario
const loginUsuario = async(req, res = response) => {

    const { email, password } = req.body;

    try {

        //Confirmando Email
        const dbUser = await Usuario.findOne({email});

        if(!dbUser) {
            return res.status(400).json({
                ok: false,
                //El mensaje del correo es por fines educativos, lo correcto es decir que alguna
                //de las credenciales no es válida
                msg: "El correo no existe"
            });
        }

        //Confirmando password
        const validPassword = bcrypt.compareSync(password, dbUser.password);

        if(!validPassword) {
            return res.status(400).json({
                ok: false,
                //El mensaje del password es por fines educativos, lo correcto es decir que alguna
                //de las credenciales no es válida
                msg: "El password no es válido"
            });
        }

        //Generar el JWT
        const token = await generarJWT(dbUser.id, dbUser.name);

        //Respuesta del servicio
        return res.json({
            ok: true,
            uid: dbUser.id,
            name: dbUser.name,
            token
        });

        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: "Hable con el administrador."
        })
    }
};

//revalidarToken
const revalidarToken = async(req, res = response) => {

    const {uid, name} = req;
    const token = await generarJWT(uid, name);

    return res.json({
        ok: true,
        uid,
        name,
        token
    });
};

module.exports = {
    crearUsuario,
    loginUsuario,
    revalidarToken
};