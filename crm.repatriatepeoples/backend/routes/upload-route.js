'use strict';

const sequelize = require('../models/index').sequelize;
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const fs = require('fs');
const path = require('path');
const pump = require('pump');

async function uploadImages(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        console.log('Request body structure:', req.body);
        console.log('Request file field:', req.body?.file);
        
        // Check if we have file data
        if (!req.body?.file) {
            responseEntries.error = true;
            responseEntries.message = "No file uploaded";
            responseEntries.code = responseCode.BAD_REQUEST;
            res.status(responseCode.BAD_REQUEST);
            return res.send(responseEntries);
        }

        const file = req.body.file;
        console.log('File details:', {
            fieldname: file.fieldname,
            filename: file.filename,
            mimetype: file.mimetype,
            encoding: file.encoding
        });

        const baseUploadDir = './uploads';
        if (!fs.existsSync(baseUploadDir)) {
            fs.mkdirSync(baseUploadDir, { recursive: true });
        }

        // Define all required directories
        const directories = {
            staff_face: path.join(baseUploadDir, 'staff-face'),
            staff_attendance: path.join(baseUploadDir, 'staff-attendance'),
            attachments: path.join(baseUploadDir, 'attachments'),
            visitor_entry: path.join(baseUploadDir, 'visitor-entry'),
            staff_proof: path.join(baseUploadDir, 'staff-proof')
        };

        // Create directories if they don't exist
        Object.values(directories).forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });

        // Determine directory from query parameter
        const { directory = 'attachments' } = req.query;
        const allowedDirectories = ['staff-face', 'staff-attendance', 'attachments', 'visitor-entry', 'staff-proof'];
        
        const targetDirectory = allowedDirectories.includes(directory) 
            ? directory 
            : 'attachments';
        
        const uploadDir = path.join(baseUploadDir, targetDirectory);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Generate unique filename
        const fileExtension = path.extname(file.filename);
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${fileExtension}`;
        const filePath = path.join(uploadDir, fileName);

        // Write the file
        const writeStream = fs.createWriteStream(filePath);
        
        // Handle file data
        await new Promise((resolve, reject) => {
            file.file.pipe(writeStream)
                .on('error', reject)
                .on('finish', resolve);
        });

        // Generate URL path
        const urlPath = `/${path.relative('.', filePath).replace(/\\/g, '/')}`;

        // Prepare response
        responseEntries.data = {
            fieldname: file.fieldname,
            originalFilename: file.filename,
            filename: fileName,
            url: urlPath,
            directory: targetDirectory,
            mimetype: file.mimetype,
            size: file.file.bytesRead || 0,
            fullUrl: `${req.protocol()}://${req.hostname()}${urlPath}`
        };
        responseEntries.message = messages.UPLOADED_SUCCESSFULLY;

    } catch (error) {
        console.error("Upload error:", error);
        responseEntries.error = true;
        responseEntries.message = error.message ? error.message : "Upload failed";
        responseEntries.code = responseCode.INTERNAL_SERVER_ERROR;
        res.status(responseCode.INTERNAL_SERVER_ERROR);
    } finally {
        res.send(responseEntries);
    }
}

// Alternative simplified version for single file upload
async function uploadSingleFileSimple(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        // Access the uploaded file
        const data = await req.file();
        
        if (!data) {
            responseEntries.error = true;
            responseEntries.message = "No file uploaded";
            responseEntries.code = responseCode.BAD_REQUEST;
            return res.status(responseCode.BAD_REQUEST).send(responseEntries);
        }

        console.log('Uploaded file details:', {
            fieldname: data.fieldname,
            filename: data.filename,
            mimetype: data.mimetype
        });

        const baseUploadDir = './uploads';
        if (!fs.existsSync(baseUploadDir)) {
            fs.mkdirSync(baseUploadDir, { recursive: true });
        }

        // Get directory from query or default
        const { directory = 'attachments' } = req.query;
        const targetDirectory = directory;
        const uploadDir = path.join(baseUploadDir, targetDirectory);
        
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Create unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const originalName = data.filename;
        const fileExtension = path.extname(originalName);
        const baseName = path.basename(originalName, fileExtension);
        const safeBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${timestamp}_${randomString}_${safeBaseName}${fileExtension}`;
        
        const filePath = path.join(uploadDir, fileName);

        // Save file
        await pump(data.file, fs.createWriteStream(filePath));

        // Generate URL
        const relativePath = path.relative('.', filePath).replace(/\\/g, '/');
        const url = `/uploads/${targetDirectory}/${fileName}`;

        responseEntries.data = {
            success: true,
            filename: fileName,
            originalName: originalName,
            url: url,
            directory: targetDirectory,
            size: data.file.bytesRead,
            mimetype: data.mimetype
        };
        responseEntries.message = "File uploaded successfully";

    } catch (error) {
        console.error("Upload error:", error);
        responseEntries.error = true;
        responseEntries.message = error.message || "Upload failed";
        responseEntries.code = responseCode.INTERNAL_SERVER_ERROR;
        res.status(responseCode.INTERNAL_SERVER_ERROR);
    }
    return res.send(responseEntries);
}

module.exports = async function (fastify) {
    fastify.register(require('@fastify/multipart'), {
        limits: {
            fileSize: 1024 * 1024 * 10, // 10MB limit
            files: 10 // Maximum 10 files
        }
        // Note: Do NOT use attachFieldsToBody: true if you want to use req.file()
    });

    // Main upload endpoint
    fastify.route({
        method: 'POST',
        url: '/upload',
        preHandler: verifyToken,
        handler: uploadSingleFileSimple
    });

    // Endpoint with directory parameter
    fastify.route({
        method: 'POST',
        url: '/upload/:directory',
        schema: {
            params: {
                type: 'object',
                properties: {
                    directory: { 
                        type: 'string',
                        enum: ['staff-face', 'staff-attendance', 'attachments', 'visitor-entry', 'staff-proof']
                    }
                }
            }
        },
        // preHandler: verifyToken,
        handler: async (req, res) => {
            req.query = { directory: req.params.directory };
            return uploadSingleFileSimple(req, res);
        }
    });
};