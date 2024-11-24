chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  
});

// let mediaRecorder = null;
// let recordedChunks = [];
// let isRecording = false; // To track if a recording is active
// let percentUploaded = 0;

// // Listener for messages from popup.js
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   switch (message.type) {
//     case 'START_FILE_UPLOADING':
//       const { ceKey, file, source } = message;

//       getFromIndexedDB((base64File) => {
//         if (base64File) {
//           const byteCharacters = atob(base64File);
//           const byteArrays = [];
//           for (let offset = 0; offset < byteCharacters.length; offset += 512) {
//             const slice = byteCharacters.slice(offset, offset + 512);
//             const byteNumbers = new Array(slice.length);
//             for (let i = 0; i < slice.length; i++) {
//               byteNumbers[i] = slice.charCodeAt(i);
//             }
//             byteArrays.push(new Uint8Array(byteNumbers));
//           }
//           const fileBlob = new Blob(byteArrays, { type: file.type });
//           const convertedFile = new File([fileBlob], file.name, { type: file.type });

//           console.log("convertedFile", convertedFile, file.size);
//           // uploadFileToServer(convertedFile, ceKey, source, sendResponse);
//         } else {
//           sendResponse({ success: false, message: 'Failed to retrieve file data.' });
//         }
//       });
//       break;
//     case 'STATU_FILE_UPLOADING':
//       sendResponse({
//         action: "currentProgress",
//         percentUploaded
//       })
//       break;
//     case 'START_RECORDING':
//       if (!isRecording) {
//         startRecording(sendResponse);
//       } else {
//         sendResponse({ success: false, error: 'Recording already started.' });
//       }
//       break;
//     case 'STOP_RECORDING':
//       if (isRecording) {
//         stopRecording(sendResponse);
//       } else {
//         sendResponse({ success: false, error: 'Recording not active.' });
//       }
//       break;
//     default:
//       sendResponse({ success: false, error: 'Unknown operation.' });
//   }
//   return true; // Keep channel open for asynchronous response
// });

// function getFromIndexedDB(callback) {
//   const request = indexedDB.open('FileDB', 1);

//   request.onsuccess = function (event) {
//     const db = event.target.result;
//     const transaction = db.transaction('files', 'readonly');
//     const store = transaction.objectStore('files');
//     const request = store.get('tempFile');

//     request.onsuccess = function () {
//       callback(request.result ? request.result.data : null);
//     };

//     request.onerror = function () {
//       callback(null);
//     };
//   };

//   request.onerror = function () {
//     callback(null);
//   };
// }


// function uploadFileToServer(file, ceKey, source, sendResponse) {
//   fetch(`https://filelu.com/chrome/post/server?key=${ceKey}`)
//     .then(response => response.json())
//     .then(data => {
//       let percentUploaded = 0;
//       const interval = setInterval(() => {
//         if (percentUploaded < 100) {
//           percentUploaded += 3; // Simulate progress
//         } else {
//           clearInterval(interval);
//         }
//       }, 500);

//       const uploadUrl = data.result;
//       const sessId = data.sess_id;
//       let fldPath = 'Chrome Extension';

//       if (source === 'Screenshot') {
//         fldPath = 'Chrome Extension/Screenshot';
//       } else if (source === 'Screen record') {
//         fldPath = 'Chrome Extension/Screen record';
//       } else if (source === 'Note') {
//         fldPath = 'Chrome Extension/Notes';
//       }

//       const formData = new FormData();
//       formData.append('sess_id', sessId);
//       formData.append('file_0', file);
//       formData.append('fld_path', fldPath);

//       fetch(uploadUrl, {
//         method: 'POST',
//         body: formData,
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       })
//         .then(response => response.json())
//         .then(uploadData => {
//           clearInterval(interval);

//           if (uploadData[0].file_status === 'OK') {
//             const fileCode = uploadData[0].file_code;
//             const fileUrl = `https://filelu.com/${fileCode}`;
//             sendResponse({
//               success: true,
//               action: 'fetchFileDetails',
//               fileUrl,
//               fileCode
//             });
//             chrome.notifications.create({
//               type: "basic",
//               iconUrl: "images/logo.png",
//               title: "Upload Successfully",
//               message: fileUrl,
//             });
//             console.log('Upload successfully. fileCode=', fileCode);
//           } else {
//             sendResponse({
//               success: false,
//               message: 'Upload failed. Please try again.'
//             });
//             console.error('Upload failed. Please try again.');
//           }
//         })
//         .catch(error => {
//           sendResponse({
//             success: false,
//             message: 'An error occurred during upload.'
//           });
//           console.error('Upload error:', error);
//         });
//     })
//     .catch(error => {
//       console.error('Error getting upload server:', error);
//     });
// }

// function startRecording(sendResponse) {
//   navigator.mediaDevices.getDisplayMedia({ video: true })
//     .then(stream => {
//       mediaRecorder = new MediaRecorder(stream);
//       recordedChunks = [];
//       isRecording = true;

//       mediaRecorder.ondataavailable = event => {
//         if (event.data.size > 0) {
//           recordedChunks.push(event.data);
//         }
//       };

//       mediaRecorder.onstop = () => handleRecordingStop(stream);

//       mediaRecorder.start();
//       console.log('Recording started');
//       sendResponse({ success: true });
//     })
//     .catch(error => {
//       console.error('Error starting recording:', error);
//       sendResponse({ success: false, error: error.message });
//     });
// }

// function stopRecording(sendResponse) {
//   if (mediaRecorder && mediaRecorder.state !== "inactive") {
//     mediaRecorder.stop();
//   }
//   isRecording = false;
//   console.log('Recording stopped');
//   sendResponse({ success: true });
// }

// function handleRecordingStop(stream) {
//   const blob = new Blob(recordedChunks, { type: "video/webm" });
//   const file = new File([blob], "screen_recording.webm", { type: "video/webm" });

//   console.log(`Recorded file ready for upload: ${file.name}`);

//   // Allow for resources cleanup
//   stream.getTracks().forEach(track => track.stop());
// }