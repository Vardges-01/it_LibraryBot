const fs = require('fs');
const config = require('config');
var request = require('request');

module.exports = {

   // Get Google Drive file
   async get(ctx, fileId) {
      try {
         await drive.permissions.create({
            fileId,
            requestBody: {
               role: 'reader',
               type: 'anyone'
            }
         });

         const result = await this.generateLink(fileId);
         ctx.telegram.sendDocument(ctx.chat.id, result.data.webContentLink).then(() => console.log("file sent"));
      } catch (error) {
         throw (error);
      }
   },

   // Delete Google Drive file
   async delete(faile_id) {
      const response = await drive.files.delete({
         fileId: faile_id
      })
         .then(() => console.log("File Uploaded"))
         .catch(err => console.log(err))
   }
}



function downloadFileTg(url) {
   try {

   } catch (error) {
   }

}


