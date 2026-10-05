const { UNAUTHORIZED } = require("../helpers/status-code");

async function verifyToken(req, reply) {
    try {
        const decoded = await req.jwtVerify();
        return { success: true, decoded };
    } catch (error) {
        if (error.message === "Authorization token expired") {
            reply.code(401).send({
                code: UNAUTHORIZED,
                message: "Token has expired. Please login again.",
            });
        } else {
            reply.code(401).send({
                code: UNAUTHORIZED,
                message: "Access Denied...!",
            });
        }
    }
}

module.exports = {
    verifyToken,
};
