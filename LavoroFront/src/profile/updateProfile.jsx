import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import Swal from "sweetalert2";

const UpdateProfile = () => {
  const [user, setUser] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [imageSrc, setImageSrc] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [crop, setCrop] = useState({ aspect: 1 / 1 });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    firstName: null,
    lastName: null,
    phoneNumber: null,
    email: null
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error("No token found");
        }

        const response = await axios.get("http://localhost:3000/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        });

        if (response.data) {
          setUser(response.data);
          setFirstName(response.data.firstName);
          setLastName(response.data.lastName);
          setPhoneNumber(response.data.phone_number);
          setProfileImage(response.data.image);
        } else {
          navigate("/auth");
        }
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate("/auth");
        } else {
          console.error("Error fetching user info:", err);
        }
      }
    };

    fetchUserInfo();
  }, [navigate]);

  const validateField = (fieldName, value) => {
    let error = null;
    
    if (fieldName === 'firstName') {
      if (!value) error = 'First name is required.';
      else if (!/^[A-Za-z\s'-]+$/.test(value)) error = 'First name must contain only letters, spaces, hyphens, or apostrophes.';
      else if (value.length < 3) error = 'First name cannot be less than three characters long.';
    } 
    else if (fieldName === 'lastName') {
      if (!value) error = 'Last name is required.';
      else if (!/^[A-Za-z\s'-]+$/.test(value)) error = 'Last name must contain only letters, spaces, hyphens, or apostrophes.';
      else if (value.length < 3) error = 'Last name cannot be less than three characters long.';
    }
    else if (fieldName === 'phoneNumber') {
      if (!value) error = 'Phone number is required.';
      else if (value.length < 8) error = 'Phone number must be at least 8 digits long.';
      else if (!/^[0-9]+$/.test(value)) error = 'Phone number must contain only numeric characters.';
      else if (/^0+$/.test(value)) error = 'Phone number cannot be all zeros.';
    }
    else if (fieldName === 'email') {
      if (!value) error = 'Email is required.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Please enter a valid email address.';
    }
    
    setErrors(prev => ({ ...prev, [fieldName]: error }));
    return !error;
  };

  const handleFirstNameChange = (e) => {
    const value = e.target.value;
    setFirstName(value);
    validateField('firstName', value);
  };

  const handleLastNameChange = (e) => {
    const value = e.target.value;
    setLastName(value);
    validateField('lastName', value);
  };

  const handlePhoneNumberChange = (e) => {
    const value = e.target.value;
    setPhoneNumber(value);
    validateField('phoneNumber', value);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setUser(prev => ({ ...prev, email: value }));
    validateField('email', value);
  };

  const handleRestoreChanges = () => {
    Swal.fire({
      title: "Restore Changes?",
      text: "Are you sure you want to discard all changes?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, restore!",
      cancelButtonText: "Cancel"
    }).then((result) => {
      if (result.isConfirmed) {
        setFirstName(user.firstName);
        setLastName(user.lastName);
        setPhoneNumber(user.phone_number);
        setProfileImage(user.image);
        setImageSrc(null);
        setCroppedImage(null);
        setErrors({
          firstName: null,
          lastName: null,
          phoneNumber: null,
          email: null
        });
        
        Swal.fire({
          title: "Restored!",
          text: "All changes have been discarded.",
          icon: "success"
        });
      }
    });
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No token found");
      }
  
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
      });
  
      if (result.isConfirmed) {
        const response = await axios.post(
          "http://localhost:3000/profiles/request-delete",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            withCredentials: true,
          }
        );
  
        if (response.status === 200) {
          await Swal.fire({
            title: "Deleted!",
            text: "Profile delete request successful!",
            icon: "success",
          });
          window.location.reload();
        }
      }
    } catch (err) {
      if (err.response?.status === 400) {
        await Swal.fire({
          title: "Error",
          text: "You already sent a deletion request.",
          icon: "error",
        });
        window.location.reload();
      } else if (err.response?.status === 401) {
        await Swal.fire({
          title: "Session Expired",
          text: "Please log in again.",
          icon: "error",
        });
        localStorage.removeItem('token');
        navigate("/auth");
      } else {
        console.error("Error deleting profile:", err);
        await Swal.fire({
          title: "Error",
          text: "Failed to delete profile.",
          icon: "error",
        });
      }
    }
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Error accessing camera:", err);
      Swal.fire({
        title: "Error",
        text: "Could not access camera. Please check permissions.",
        icon: "error"
      });
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/png");
    setImageSrc(imageData);
    setShowCameraModal(false);
    setShowCropModal(true);
  };

  const previewImage = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target.result);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (crop) => {
    if (imgRef.current && crop.width && crop.height) {
      const croppedImageUrl = getCroppedImg(imgRef.current, crop);
      setCroppedImage(croppedImageUrl);
    }
  };

  const getCroppedImg = (image, crop) => {
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return canvas.toDataURL("image/png");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isFirstNameValid = validateField('firstName', firstName);
    const isLastNameValid = validateField('lastName', lastName);
    const isPhoneNumberValid = validateField('phoneNumber', phoneNumber);
    const isEmailValid = validateField('email', user.email);
    
    if (!isFirstNameValid || !isLastNameValid || !isPhoneNumberValid || !isEmailValid) {
      await Swal.fire({
        title: "Validation Error",
        text: "Please fix the errors in the form before submitting.",
        icon: "error",
      });
      return;
    }
    
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      alert("No token found. Please log in again.");
      navigate("/auth");
      return;
    }

    const formData = new FormData();
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("phoneNumber", phoneNumber);
    formData.append("email", user.email);

    if (croppedImage) {
      const blob = await fetch(croppedImage).then((res) => res.blob());
      formData.append("image", blob, "profile.png");
    } else if (profileImage) {
      formData.append("image", profileImage);
    }

    try {
      const response = await axios.post("http://localhost:3000/profiles/update", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      if (response.status === 200) {
        await Swal.fire({
          title: "Updated!",
          text: "Profile updated successfully!",
          icon: "success",
        });
        window.location.reload();
      }
    } catch (err) {
      if (err.response?.status === 401) {
        alert("Session expired. Please log in again.");
        localStorage.removeItem('token');
        navigate("/auth");
      } else {
        console.error("Error updating profile:", err);
        await Swal.fire({
          title: "Error",
          text: "Failed updating profile!",
          icon: "error",
        });
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <p>Loading...</p>;
  }

  return (
    <div className="row gap-3 justify-content-center">
      <div className="p-3 border-bottom border-top border-block-end-dashed tab-content">
        <div className="tab-pane show active overflow-hidden p-0 border-0" id="account-pane" role="tabpanel" aria-labelledby="account" tabIndex="0">
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-1">
            <div className="fw-semibold d-block fs-15">Account Settings :</div>
            <div 
              className="btn btn-primary btn-sm" 
              onClick={handleRestoreChanges}
            >
              <i className="ri-loop-left-line lh-1 me-2"></i>Restore Changes
            </div>
          </div>
          <div className="row gy-3">
            <div className="col-xl-12">
              <div className="d-flex align-items-start flex-wrap gap-3">
                <div>
                  <span className="avatar avatar-xxl" style={{ marginLeft: "10px" }}>
                    {profileImage ? (
                     <img
                     src={
                       profileImage
                         ? profileImage.startsWith('data:image') 
                           ? profileImage // Use as-is for data URLs
                           : profileImage.startsWith('http') || profileImage.startsWith('https')
                             ? profileImage // Use as-is for full URLs
                             : `http://localhost:3000${profileImage}` // Prepend server URL for relative paths
                         : "https://via.placeholder.com/100" // Fallback if no image
                     }
                     alt="Profile"
                     style={{
                       width: "100px",
                       height: "100px",
                       borderRadius: "50%",
                       objectFit: "cover",
                       marginBottom: "10px"
                     }}
                     onError={(e) => {
                       e.target.src = "https://via.placeholder.com/100";
                     }}
                   />
                    ) : (
                      <p>No profile image uploaded.</p>
                    )}
                  </span>
                </div>
                <div>
                  <span className="fw-medium d-block mb-2">Profile Picture</span>
                  <div className="btn-list mb-1">
                    <button 
                      className="btn btn-sm btn-primary btn-wave" 
                      data-bs-toggle="modal" 
                      data-bs-target="#imageSourceModal"
                    >
                      <i className="ri-upload-2-line me-1"></i>Change Image
                    </button>
                    <button 
                      className="btn btn-sm btn-primary1-light btn-wave" 
                      onClick={() => setProfileImage("")}
                    >
                      <i className="ri-delete-bin-line me-1"></i>Remove
                    </button>
                  </div>
                  <span className="d-block fs-12 text-muted">Use JPEG, PNG, or GIF. Best size: 200x200 pixels. Keep it under 5MB</span>
                </div>
              </div>
            </div>
            <div className="col-xl-12">
              <label htmlFor="profile-user-name" className="form-label">First Name :</label>
              <input
                type="text"
                className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                id="profile-user-name"
                value={firstName}
                onChange={handleFirstNameChange}
                placeholder="Enter First Name"
              />
              {errors.firstName && (
                <div className="invalid-feedback d-block">{errors.firstName}</div>
              )}
            </div>
            <div className="col-xl-12">
              <label htmlFor="profile-last-name" className="form-label">Last Name :</label>
              <input
                type="text"
                className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                id="profile-last-name"
                value={lastName}
                onChange={handleLastNameChange}
                placeholder="Enter Last Name"
              />
              {errors.lastName && (
                <div className="invalid-feedback d-block">{errors.lastName}</div>
              )}
            </div>
            <div className="col-xl-12">
              <label htmlFor="profile-phone-number" className="form-label">Phone Number :</label>
              <input
                type="text"
                className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
                id="profile-phone-number"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                placeholder="Enter Phone Number"
              />
              {errors.phoneNumber && (
                <div className="invalid-feedback d-block">{errors.phoneNumber}</div>
              )}
            </div>
            <div className="col-xl-12">
              <label htmlFor="profile-email" className="form-label">Email :</label>
              <input
                type="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                id="profile-email"
                value={user.email}
                onChange={handleEmailChange}
                placeholder="Enter Email"
              />
              {errors.email && (
                <div className="invalid-feedback d-block">{errors.email}</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="card-footer border-top-0">
        <div className="btn-list float-end">
          <button className="btn btn-primary2 btn-wave" id="alert-confirm" onClick={handleDeleteAccount}>
            Deactivate Account
          </button>
          <button className="btn btn-primary btn-wave" onClick={handleSubmit} disabled={loading}>
            {loading ? "Updating..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Image Source Selection Modal */}
      <div className="modal fade" id="imageSourceModal" tabIndex="-1" aria-labelledby="imageSourceModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="imageSourceModalLabel">Choose Image Source</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="d-grid gap-2">
                <button 
                  type="button" 
                  className="btn btn-primary"
                  data-bs-dismiss="modal"
                  onClick={() => {
                    setShowCameraModal(true);
                    openCamera();
                  }}
                >
                  <i className="ri-camera-line me-2"></i>Capture Image
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => fileInputRef.current.click()}
                >
                  <i className="ri-upload-line me-2"></i>Upload Image from PC
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="modal fade show d-block" id="cameraModal" tabIndex="-1" aria-labelledby="cameraModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="cameraModalLabel">Capture Photo</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowCameraModal(false);
                    const stream = videoRef.current?.srcObject;
                    if (stream) {
                      stream.getTracks().forEach(track => track.stop());
                    }
                  }}
                ></button>
              </div>
              <div className="modal-body text-center">
                <video ref={videoRef} width="100%" autoPlay></video>
                <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={capturePhoto}
                >
                  Capture
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCameraModal(false);
                    const stream = videoRef.current?.srcObject;
                    if (stream) {
                      stream.getTracks().forEach(track => track.stop());
                    }
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crop Modal */}
      {showCropModal && (
        <div className="modal fade show d-block" id="cropModal" tabIndex="-1" aria-labelledby="cropModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="cropModalLabel">Crop Image</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowCropModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <ReactCrop
                  src={imageSrc}
                  crop={crop}
                  onChange={(newCrop) => setCrop(newCrop)}
                  onComplete={onCropComplete}
                >
                  <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="Crop me"
                    style={{ maxWidth: "100%", maxHeight: "500px", height: "auto", width: "auto" }}
                  />
                </ReactCrop>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setProfileImage(croppedImage || imageSrc);
                    setShowCropModal(false);
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCropModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={previewImage}
      />
    </div>
  );
};

export default UpdateProfile;