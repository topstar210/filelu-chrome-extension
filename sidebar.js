let mediaRecorder;
let recordedChunks = [];
let allDownloadLinks = [];

document.addEventListener('DOMContentLoaded', function () {
    // Fetch user info on load
    chrome.storage.sync.get(['fileluCEKey'], function (result) {
        if (result.fileluCEKey) {
            const ceKey = result.fileluCEKey;

            fetch(`https://filelu.com/chrome/account/info?key=${ceKey}`)
                .then(response => response.json())
                .then(data => {
                    if (data.status === 200 && data.msg === 'OK') {
                        const { storage, storage_used, utype } = data.result;

                        const storageProgress = document.getElementById('storageProgress');
                        const storageUsageText = document.getElementById('storageUsageText');
                        const accountTypeIcon = document.getElementById('accountTypeIcon');
                        const accountTypeLabel = document.getElementById('accountTypeLabel');

                        const totalStorage = parseFloat(storage);
                        const usedStorage = parseFloat(storage_used);
                        const percentUsed = (usedStorage / totalStorage) * 100;

                        // Update progress bar
                        storageProgress.style.width = `${percentUsed}%`;

                        // Update storage usage text
                        storageUsageText.innerHTML = `Disk usage: <i class="bi bi-hdd"></i> <span style="color: blue;">${usedStorage} GB</span> of ${totalStorage} GB`;

                        // Add icon and label for account type
                        if (utype === 'prem') {
                            accountTypeIcon.className = 'bi bi-star-fill'; // Bootstrap Star Fill Icon for premium
                            accountTypeLabel.textContent = 'PREMIUM';
                            accountTypeIcon.setAttribute("title", "Premium Account");
                            accountTypeIcon.style.color = '#ffd700'; // Gold color for premium
                        } else {
                            accountTypeIcon.className = 'bi bi-person-fill'; // Bootstrap Person Fill Icon for free
                            accountTypeLabel.textContent = 'FREE';
                            accountTypeIcon.setAttribute("title", "Free Account");
                            accountTypeIcon.style.color = '#555'; // Default color for free
                        }
                    } else {
                        console.error('Failed to retrieve user info:', data);
                    }
                })
                .catch(error => console.error('Error fetching user info:', error));
        } else {
            //alert('Please set your FileLu Chrome Extension Key.');


        }
    });
});
document.addEventListener('DOMContentLoaded', function () {
    const addKeyButton = document.getElementById('addKeyButton');
    const saveKeyButton = document.getElementById('saveKeyButton');
    const ceKeyInput = document.getElementById('CEKey');
    const uploadButton = document.getElementById('uploadButton');
    const captureButton = document.getElementById('captureButton');
    const fileInput = document.getElementById('fileInput');
    const uploadProgress = document.getElementById('uploadProgress');
    const downloadUrl = document.getElementById('downloadUrl');
    const fileLink = document.getElementById('fileLink');
    const shareOptions = document.querySelector('.share-options');
    shareOptions.classList.add('hidden');
    const recordButton = document.getElementById('recordButton');

    // Start URL upload
    const urlUploadButton = document.getElementById('urlUploadButton');
    const urlUploadSection = document.getElementById('urlUploadSection');
    const urlInput = document.getElementById('urlInput');
    const sendUrlButton = document.getElementById('sendUrlButton');

    urlUploadButton.addEventListener('click', () => {
        urlUploadSection.classList.toggle('hidden');

        if (!urlUploadSection.classList.contains('hidden')) {
            urlInput.focus();
            uploadButton.style.display = 'none';
            dropZone.style.display = 'none';
        } else {
            uploadButton.style.display = 'inline-block';
            dropZone.style.display = 'inline-block';
        }
    });

    sendUrlButton.addEventListener('click', () => {
        const urls = urlInput.value.trim().split('\n');
        if (urls.length > 0) {
            chrome.storage.sync.get(['fileluCEKey'], function (result) {
                if (result.fileluCEKey) {
                    const ceKey = result.fileluCEKey;

                    // Hide URL upload UI and show status UI
                    urlUploadSection.classList.add('hidden');
                    document.getElementById('uploadStatus').classList.remove('hidden');

                    urls.forEach(url => {
                        url = url.trim();
                        if (url) {
                            const formData = new URLSearchParams();
                            formData.append('key', ceKey);
                            formData.append('url', url);

                            fetch('https://filelu.com/chrome/upload/url', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded'
                                },
                                body: formData.toString()
                            })
                                .then(response => response.json())
                                .then(data => {
                                    if (data.status === 200 && data.msg === 'OK') {
                                        // Start checking the status of the upload
                                        setTimeout(() => {
                                            checkUploadStatus(ceKey, data.result.filecode);
                                        }, 5000); // Wait 5s before starting status check
                                    } else {
                                        console.error('Upload failed:', data);
                                        alert(`Failed to upload: ${url}. Error: ${data.msg}`);
                                    }
                                })
                                .catch(error => {
                                    console.error('Error uploading file from URL:', error);
                                    alert('There was an error processing your request.');
                                });
                        }
                    });
                } else {
                    alert('Please configure your FileLu Chrome Extension Key.');
                }
            });
        } else {
            alert('Please enter at least one valid URL.');
        }
    });

    function checkUploadStatus(ceKey, fileCode) {
        fetch(`https://filelu.com/chrome/file/status?key=${ceKey}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 200 && data.msg === 'OK') {
                    const { percent, speed, url_count } = data.result;
                    document.getElementById('uploadProgressText').textContent = `Progress: ${percent}`;
                    document.getElementById('urlCountText').textContent = `URLs left: ${url_count}`;
                    document.getElementById('uploadSpeedText').textContent = `Speed: ${speed}`;

                    if (url_count > 0) {
                        setTimeout(() => {
                            checkUploadStatus(ceKey, fileCode);
                        }, 2000); // Check every 3s
                    } else {
                        const fileUrl = `https://filelu.com/${fileCode}`;
                        fetchFileDetails(fileUrl, fileCode);
                        document.getElementById('uploadStatus').classList.add('hidden');
                    }
                } else {
                    console.error('Failed to check upload status:', data);
                }
            })
            .catch(error => {
                console.error('Error checking upload status:', error);
            });
    }
    //End url upload

    chrome.storage.sync.get(['fileluCEKey'], function (result) {
        if (result.fileluCEKey) {
            addKeyButton.setAttribute('data-tooltip', 'Update Chrome Extension Key');
            uploadButton.classList.remove('hidden');
            captureButton.classList.remove('hidden');

            recordButton.classList.remove('hidden');
        } else {
            addKeyButton.setAttribute('data-tooltip', 'Add Chrome Extension Key');
        }
    });

    addKeyButton.addEventListener('click', () => {
        ceKeyInput.classList.toggle('hidden');
        saveKeyButton.classList.toggle('hidden');
        getKeyButton.classList.toggle('hidden');
        if (!ceKeyInput.classList.contains('hidden')) {
            ceKeyInput.focus();
        }
    });

    saveKeyButton.addEventListener('click', () => {
        const ceKey = ceKeyInput.value.trim();
        if (ceKey) {
            chrome.storage.sync.set({ fileluCEKey: ceKey }, function () {
                alert('Chrome Extension Key saved successfully');
                ceKeyInput.classList.add('hidden');
                saveKeyButton.classList.add('hidden');
                addKeyButton.setAttribute('data-tooltip', 'Update Chrome Extension Key');
                uploadButton.classList.remove('hidden');
                captureButton.classList.remove('hidden');
                getKeyButton.classList.toggle('hidden');
                recordButton.classList.remove('hidden');
            });
        } else {
            alert('Please enter a valid FileLu Chrome Extension key');
        }
    });

    uploadButton.addEventListener('click', () => {
        fileInput.click();
    });

    captureButton.addEventListener('click', () => {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, function (dataUrl) {
            console.log(chrome.runtime.lastError)
          if (chrome.runtime.lastError || !dataUrl) {
            alert('Failed to capture the tab. Please try again.');
          } else {
            uploadScreenshot(dataUrl);
          }
        });
    });
    document.addEventListener('DOMContentLoaded', function () {
        const recordButton = document.getElementById('recordButton');

        recordButton.addEventListener('click', () => {
            const action = recordButton.textContent.includes('Start') ? 'START_RECORDING' : 'STOP_RECORDING';

            chrome.runtime.sendMessage({ type: action }, response => {
                if (response.success) {
                    recordButton.textContent = action === 'START_RECORDING' ? "Stop Screen Record" : "Start Screen Record";
                } else {
                    alert(`${action.replace('_', ' ').toLowerCase()} failed: ${response.error}`);
                }
            });
        });
    });
    recordButton.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
            recordButton.textContent = "Start Screen Record";
        } else {
            recordScreen();
        }
    });



    async function recordScreen() {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            mediaRecorder = new MediaRecorder(stream);
            recordedChunks = [];
            recordButton.style.backgroundColor = "red";
            recordButton.style.color = "white";

            mediaRecorder.ondataavailable = function (e) {
                if (e.data.size > 0) {
                    recordedChunks.push(e.data);
                }
            };

            mediaRecorder.onstop = function () {
                const blob = new Blob(recordedChunks, { type: "video/mp4" });
                const file = new File([blob], "screen_recording.mp4", { type: "video/mp4" });
                handleFileUpload(file, 'Screen record');
                recordButton.style.backgroundColor = "";
                recordButton.style.color = "";
                recordButton.textContent = "Start Screen Record";

                // Stop all streams to free resources
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            recordButton.textContent = "Stop Screen Record";
        } catch (err) {
            console.error("Error: " + err);
        }
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
        } else {
            console.error("No recording in progress");
        }
    }

    function uploadScreenshot(dataUrl) {
        fetch(dataUrl)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], "screenshot.png", { type: "image/png" });
                handleFileUpload(file, 'Screenshot');
            });
    }

    fileInput.addEventListener('change', function () {
        const files = this.files;
        if (files.length > 0) {
            shareOptions.classList.add('hidden');
            for (let i = 0; i < files.length; i++) {
                handleFileUpload(files[i]);
            }
        }
    });
    // footer link
    document.querySelector('.footer-links').addEventListener('click', (event) => {
        if (event.target.tagName === 'A') {
            const url = event.target.getAttribute('href');
            window.open(url, '_blank');
            event.preventDefault();
        }
    });
    document.querySelector('.links').addEventListener('click', (event) => {
        if (event.target.tagName === 'A') {
            const url = event.target.getAttribute('href');
            window.open(url, '_blank');
            event.preventDefault();
        }
    });

    //dragndrop

    // Identify the drop zone container
    const dropZone = document.getElementById('dropZone');

    dropZone.addEventListener('dragover', (event) => {
        event.preventDefault(); // Prevent default to allow drop
        dropZone.classList.add('active');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('active');
    });

    dropZone.addEventListener('drop', (event) => {
        event.preventDefault();
        dropZone.classList.remove('active');
        const items = event.dataTransfer.items;

        if (items) {
            for (let i = 0; i < items.length; i++) {
                const item = items[i].webkitGetAsEntry();
                if (item) {
                    traverseFileTree(item);
                }
            }
        } else {
            handleFiles(event.dataTransfer.files);
        }
    });

    function traverseFileTree(item, path = "") {
        path = path || "";
        if (item.isFile) {
            item.file(file => {
                handleFileUpload(file);
            });
        } else if (item.isDirectory) {
            const dirReader = item.createReader();
            dirReader.readEntries(entries => {
                for (let i = 0; i < entries.length; i++) {
                    traverseFileTree(entries[i], path + item.name + "/");
                }
            });
        }
    }

    function handleFiles(files) {
        Array.from(files).forEach(handleFileUpload);
    }
    //drag


    //Note
    const addNoteButton = document.getElementById('addNoteButton');
    const noteModal = document.getElementById('noteModal');
    const noteTextarea = document.getElementById('noteTextarea');
    const noteFilename = document.getElementById('noteFilename');
    const saveNoteButton = document.getElementById('saveNoteButton');
    const closeNoteModalButton = document.getElementById('closeNoteModal');

    addNoteButton.addEventListener('click', () => {
        noteTextarea.value = ''; // Clear previous entries
        noteFilename.value = 'note.txt'; // Default filename
        noteModal.style.display = 'flex'; // Show the modal
    });

    closeNoteModalButton.addEventListener('click', () => {
        noteModal.style.display = 'none'; // Hide the modal
    });

    saveNoteButton.addEventListener('click', () => {
        const noteContent = noteTextarea.value;
        const filename = noteFilename.value || 'note.txt';
        if (noteContent) {
            const blob = new Blob([noteContent], { type: 'text/plain' });
            const file = new File([blob], filename, { type: 'text/plain' });

            handleFileUpload(file, 'Note');
            noteModal.style.display = 'none'; // Close the modal after saving
        } else {
            alert('Please enter some content for the note.');
        }
    });
    // End Note
    function handleFileUpload(file, source) {
        uploadButton.disabled = true; // Disable the button
        chrome.storage.sync.get(['fileluCEKey'], function (result) {
            if (result.fileluCEKey) {
                const ceKey = result.fileluCEKey;

                fetch(`https://filelu.com/chrome/post/server?key=${ceKey}`)
                    .then(response => response.json())
                    .then(data => {
                        const uploadUrl = data.result;
                        const sessId = data.sess_id;
                        let fldPath = 'Chrome Extension';

                        if (source === 'Screenshot') {
                            fldPath = 'Chrome Extension/Screenshot';
                        } else if (source === 'Screen record') {
                            fldPath = 'Chrome Extension/Screen record';
                        } else if (source === 'Note') {
                            fldPath = 'Chrome Extension/Notes';
                        }

                        const formData = new FormData();
                        formData.append('sess_id', sessId);
                        formData.append('file_0', file);
                        formData.append('fld_path', fldPath);

                        const xhr = new XMLHttpRequest();
                        xhr.open('POST', uploadUrl, true);

                        xhr.upload.onprogress = (event) => {
                            if (event.lengthComputable) {
                                const percentComplete = (event.loaded / event.total) * 100;
                                uploadProgress.value = percentComplete;
                                uploadProgress.classList.remove('hidden');
                            }
                        };

                        xhr.onload = function () {
                            uploadProgress.classList.add('hidden');
                            uploadButton.disabled = false; // Re-enable the button

                            if (xhr.status === 200) {
                                const uploadData = JSON.parse(xhr.responseText);
                                if (uploadData[0].file_status === 'OK') {
                                    const fileCode = uploadData[0].file_code;
                                    const fileUrl = `https://filelu.com/${fileCode}`;
                                    // Fetch file details using fileCode
                                    fetchFileDetails(fileUrl, fileCode);
                                } else {
                                    alert('Upload failed. Please try again.');
                                }
                            } else {
                                alert('An error occurred during upload.');
                            }
                        };

                        xhr.onerror = function () {
                            uploadButton.disabled = false; // Re-enable the button on error
                            alert('An error occurred during upload.');
                        };

                        xhr.send(formData);
                    })
                    .catch(error => {
                        uploadButton.disabled = false; // Re-enable the button on error
                        console.error('Error getting upload server:', error);
                    });
            } else {
                alert('Please set your FileLu Chrome Extension Key.');
                ceKeyInput.classList.toggle('hidden');
                saveKeyButton.classList.toggle('hidden');
                getKeyButton.classList.toggle('hidden');
                uploadButton.disabled = false; // Re-enable the button if no key is set
            }
        });
    }

    // Add this function anywhere above the triggering call, but logically placed after your event handlers.
    // Add this function anywhere above the triggering call, but logically placed after your event handlers.
    function fetchFileDetails(fileUrl, fileCode) {
        chrome.storage.sync.get(['fileluCEKey'], function (result) {
            if (result.fileluCEKey) {
                const ceKey = result.fileluCEKey;

                fetch(`https://filelu.com/chrome/file/info?file_code=${fileCode}&key=${ceKey}`)
                    .then(response => response.json())
                    .then(data => {
                        console.log('File Details Fetch Response:', data);
                        if (data.status === 200 && data.msg === 'OK' && data.result.length > 0) {
                            const fileDetails = data.result[0]; // Adjust for possibly missing detail structure
                            if (fileDetails) {
                                const fileName = fileDetails.name || 'Unknown Name'; // Ensure there's a fallback, if any
                                const thumbnailUrl = fileDetails.thumbnail || 'default_thumbnail.jpg'; // Ensure there's a fallback
                                console.log('File Name:', fileName);
                                console.log('Thumbnail URL:', thumbnailUrl);
                                createDownloadLink(fileUrl, fileName, thumbnailUrl);
                            } else {
                                console.error('No file details found.');
                            }
                        } else {
                            console.error('Failed to fetch file details:', data);
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching file details:', error);
                    });
            } else {
                console.error('No FileLu CE Key available.');
            }
        });
    }
    function updateRecentUploads(fileInfo) {
        chrome.storage.sync.get(['recentUploads'], function (result) {
            let uploads = result.recentUploads || [];

            // Add new file info at the beginning
            uploads.unshift(fileInfo);

            // Limit to the most recent 10 entries
            if (uploads.length > 10) {
                uploads.pop();
            }

            // Save the updated list back to chrome storage
            chrome.storage.sync.set({ 'recentUploads': uploads }, function () {
                console.log('Recent uploads updated:', uploads);
            });
        });
    }

    function createDownloadLinkElement(container, fileUrl, fileName, thumbnailUrl) {
        const linkContainer = document.createElement('div');
        linkContainer.className = "link-container";

        const thumbnail = document.createElement('img');
        thumbnail.src = thumbnailUrl;  // Use thumbnail URL
        thumbnail.className = "thumbnail";

        const linkElement = document.createElement('a');
        linkElement.href = fileUrl;
        linkElement.target = '_blank';
        linkElement.textContent = fileName;  // Use fileName
        linkElement.className = "filename";

        const copyButton = document.createElement('button');
        copyButton.textContent = "Copy Link";
        copyButton.className = "copy-button";

        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(fileUrl).then(() => {
                copyButton.textContent = "Copied!";
                copyButton.disabled = true;
                setTimeout(() => {
                    copyButton.textContent = "Copy Link";
                    copyButton.disabled = false;
                }, 2000);
            }).catch(err => console.error('Error copying link: ', err));
        });

        linkContainer.appendChild(thumbnail);
        linkContainer.appendChild(linkElement);
        linkContainer.appendChild(copyButton);
        container.appendChild(linkContainer);

        allDownloadLinks.push(fileUrl);
        shareOptions.classList.remove('hidden');
        setupSharing();
    }

    document.getElementById('recentUploadsButton').addEventListener('click', function () {
        const recentUploadsContainer = document.getElementById('recentUploadsContainer');

        // Retrieve the data
        chrome.storage.sync.get(['recentUploads'], function (result) {
            recentUploadsContainer.innerHTML = ''; // Clear existing entries

            const uploads = result.recentUploads || [];
            if (uploads.length > 0) {
                uploads.forEach(upload => {
                    createDownloadLinkElement(recentUploadsContainer, upload.fileUrl, upload.fileName, upload.thumbnailUrl);
                });
            } else {
                recentUploadsContainer.innerHTML = '<p>No recent uploads found.</p>';
            }

            // Toggle the display state
            if (uploads.length === 0 || !recentUploadsContainer.classList.contains('hidden')) {
                recentUploadsContainer.style.display = 'none';
                recentUploadsContainer.classList.add('hidden');
            } else {
                recentUploadsContainer.style.display = 'block';
                recentUploadsContainer.classList.remove('hidden');
            }
        });
    });
    function updateRecentUploads(fileInfo) {
        chrome.storage.sync.get(['recentUploads'], function (result) {
            let uploads = result.recentUploads || [];

            // Add new file info at the beginning
            uploads.unshift(fileInfo);

            // Limit to the most recent 10 entries
            if (uploads.length > 10) {
                uploads.pop();
            }

            // Save the updated list back to chrome storage
            chrome.storage.sync.set({ 'recentUploads': uploads }, function () {
                console.log('Recent uploads updated:', uploads);
            });
        });
    }

    function createDownloadLink(fileUrl, fileName, thumbnailUrl) {
        // Update recent uploads storage
        updateRecentUploads({ fileUrl, fileName, thumbnailUrl });

        const downloadUrls2 = document.getElementById('downloadUrls2');

        const linkContainer = document.createElement('div');
        linkContainer.className = "link-container";

        const thumbnail = document.createElement('img');
        thumbnail.src = thumbnailUrl;  // Use thumbnail URL
        thumbnail.className = "thumbnail";

        const linkElement = document.createElement('a');
        linkElement.href = fileUrl;
        linkElement.target = '_blank';
        linkElement.textContent = fileName;  // Use fileName
        linkElement.className = "filename";

        const copyButton = document.createElement('button');
        copyButton.textContent = "Copy Link";
        copyButton.className = "copy-button";

        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(fileUrl).then(() => {
                copyButton.textContent = "Copied!";
                copyButton.disabled = true;
                setTimeout(() => {
                    copyButton.textContent = "Copy Link";
                    copyButton.disabled = false;
                }, 2000);
            }).catch(err => console.error('Error copying link: ', err));
        });

        linkContainer.appendChild(thumbnail);
        linkContainer.appendChild(linkElement);
        linkContainer.appendChild(copyButton);
        downloadUrls2.appendChild(linkContainer);

        allDownloadLinks.push(fileUrl);
        shareOptions.classList.remove('hidden');
        setupSharing();
    }
    function setupSharing() {
        const allLinksText = allDownloadLinks.join('\n');
        const copyAllLinksButton = document.getElementById('copyAllLinks');

        if (copyAllLinksButton) {
            copyAllLinksButton.replaceWith(copyAllLinksButton.cloneNode(true));
            const newCopyAllLinksButton = document.getElementById('copyAllLinks');

            newCopyAllLinksButton.addEventListener('click', () => {
                navigator.clipboard.writeText(allLinksText)
                    .then(() => {
                        newCopyAllLinksButton.textContent = "Copied!";
                        setTimeout(() => {
                            newCopyAllLinksButton.textContent = "Copy All Links";
                        }, 2000);
                    })
                    .catch(err => console.error('Error copying all links:', err));
            });
        }

        document.getElementById('shareEmail').addEventListener('click', () => {
            console.log('Email share button clicked');
            window.open(`mailto:?subject=Download&body=Check out these files: ${encodeURIComponent(allLinksText)}`, '_blank');
        });


        document.getElementById('shareFacebook').addEventListener('click', () => {
            console.log("Facebook share button clicked.");
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(allLinksText)}`, '_blank');
        });

        document.getElementById('shareTwitter').addEventListener('click', () => {
            window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(allLinksText)}`, '_blank');
        });

        document.getElementById('shareWhatsApp').addEventListener('click', () => {
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(allLinksText)}`, '_blank');
        });

        document.getElementById('shareLinkedIn').addEventListener('click', () => {
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(allLinksText)}`, '_blank');
        });

        document.getElementById('shareMessenger').addEventListener('click', () => {
            window.open(`https://www.messenger.com/new?link=${encodeURIComponent(allLinksText)}`, '_blank');
        });

        document.getElementById('shareTelegram').addEventListener('click', () => {
            window.open(`https://t.me/share/url?url=${encodeURIComponent(allLinksText)}`, '_blank');
        });

        document.getElementById('shareReddit').addEventListener('click', () => {
            window.open(`https://reddit.com/submit?url=${encodeURIComponent(allLinksText)}`, '_blank');
        });

        document.getElementById('sharePinterest').addEventListener('click', () => {
            window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(allLinksText)}`, '_blank');
        });
    }
});
