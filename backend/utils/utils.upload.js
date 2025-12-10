import fs from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'


const uploadUtils = {
	checkMimeTypes(data_mime_type) {
		const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
		if (!allowedMimeTypes.includes(data_mime_type)) {
			return false
		}
		return true
	},

	async uploadFileHandler(data, user_id) {
		try {
			// 3. Prepare Upload Directory
			const uploadsDir = "/app/uploads"
			// added by xeloda: create uploads directory if it doesn't exist
			if (!fs.existsSync(uploadsDir)) {
				fs.mkdirSync(uploadsDir, { recursive: true });
			}
			// 4. Generate Unique Filename
			// We use the user ID + timestamp to ensure uniqueness and avoid caching issues
			const extension = path.extname(data.filename)
			const newFilename = `avatar_${user_id}_${Date.now()}${extension}`
			const uploadPath = path.join(uploadsDir, newFilename)

			// 5. Save File to Disk (Stream)
			// 'pipeline' is the modern, safe way to pipe streams in Node.js
			await pipeline(data.file, fs.createWriteStream(uploadPath))

			// added by xeloda: return accessible URL path instead of file system path
			const avatarUrl = `/uploads/${newFilename}`

			return ({
				success: true,
				result: avatarUrl
			})

		} catch (err) {
			return ({
				success: false,
				result: err.message
			})
		}
	},

}



export default uploadUtils