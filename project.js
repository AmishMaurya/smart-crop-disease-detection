console.log("JavaScript connected successfully!");


// =========================
// Scanner Elements
// =========================

const scanBtn = document.getElementById("scanBtn");
const uploadBtn = document.getElementById("uploadBtn");
const imageInput = document.getElementById("cropImage");
const preview = document.getElementById("preview");
const analyzeBtn = document.getElementById("analyzeBtn");
const result = document.getElementById("result");


// =========================
// Disease Data
// =========================

const diseaseData = {

    Tomato: {

        "Early Blight": {
            symptoms: "Dark spots and yellowing of leaves may appear.",
            causes: "Usually associated with fungal infection and favorable moisture conditions.",
            prevention: "Maintain good plant spacing and avoid unnecessary leaf wetness.",
            management: "Remove severely affected plant material and follow locally recommended management practices."
        },

        "Late Blight": {
            symptoms: "Dark lesions may develop on leaves and stems.",
            causes: "Favored by cool and humid conditions.",
            prevention: "Maintain good airflow and avoid prolonged moisture on foliage.",
            management: "Remove affected material and seek appropriate agricultural guidance."
        },

        "Leaf Mold": {
            symptoms: "Yellow patches may develop on leaves.",
            causes: "Favored by high humidity and poor air circulation.",
            prevention: "Improve ventilation and avoid excessive moisture.",
            management: "Remove affected leaves and improve growing conditions."
        },
        
        "Septoria Leaf Spot": {
            symptoms: "Small circular or irregular spots may appear on older leaves, sometimes with darker margins.",
            causes: "A fungal disease that can spread under warm and humid conditions.",
            prevention: "Maintain good airflow, avoid unnecessary leaf wetness, and remove affected plant material.",
            management: "Remove severely affected leaves and follow locally recommended crop-disease management practices."
        },

        "Healthy": {
            symptoms: "Leaves appear generally green and healthy.",
            causes: "No obvious disease detected.",
            prevention: "Continue good crop-management practices.",
            management: "Monitor the plant regularly."
        }
    },


    Potato: {

        "Early Blight": {
            symptoms: "Dark spots can develop on older leaves.",
            causes: "Fungal disease favored by suitable moisture conditions.",
            prevention: "Maintain plant health and remove affected leaves.",
            management: "Follow locally recommended crop-management practices."
        },

        "Late Blight": {
            symptoms: "Dark lesions and rapid leaf damage can occur.",
            causes: "Favored by cool and wet conditions.",
            prevention: "Maintain good airflow.",
            management: "Remove affected plant material and consult local agricultural guidance."
        },

        "Healthy": {
            symptoms: "No obvious disease symptoms detected.",
            causes: "No obvious disease detected.",
            prevention: "Continue regular crop monitoring.",
            management: "Maintain normal crop-care practices."
        }
    },


    Rice: {

        "Leaf Blast": {
            symptoms: "Spindle-shaped lesions may develop on leaves.",
            causes: "A fungal disease affecting rice leaves.",
            prevention: "Maintain balanced crop nutrition and monitor fields.",
            management: "Follow locally recommended rice disease-management practices."
        },

        "Brown Spot": {
            symptoms: "Brown spots may appear on leaves.",
            causes: "Can be associated with environmental and crop-management conditions.",
            prevention: "Maintain proper crop nutrition.",
            management: "Follow appropriate agricultural recommendations."
        },

        "Bacterial Leaf Blight": {
            symptoms: "Leaf margins may show yellowing or drying.",
            causes: "Bacterial infection affecting rice plants.",
            prevention: "Use good field hygiene.",
            management: "Consult local agricultural experts."
        },

        "Healthy": {
            symptoms: "No obvious disease symptoms detected.",
            causes: "No obvious disease detected.",
            prevention: "Continue regular monitoring.",
            management: "Maintain normal crop-care practices."
        }
    },


    Maize: {

        "Common Rust": {
            symptoms: "Small rust-colored spots may appear on leaves.",
            causes: "Fungal disease affecting maize foliage.",
            prevention: "Maintain good crop health.",
            management: "Follow locally recommended disease-management practices."
        },

        "Northern Leaf Blight": {
            symptoms: "Long grayish or brown lesions may develop on leaves.",
            causes: "Fungal disease affecting maize leaves.",
            prevention: "Maintain good field management.",
            management: "Follow local agricultural recommendations."
        },

        "Gray Leaf Spot": {
            symptoms: "Gray or brown rectangular lesions may appear.",
            causes: "Fungal disease affecting maize foliage.",
            prevention: "Maintain good crop-management practices.",
            management: "Seek local agricultural guidance."
        },

        "Healthy": {
            symptoms: "No obvious disease symptoms detected.",
            causes: "No obvious disease detected.",
            prevention: "Continue regular monitoring.",
            management: "Maintain normal crop-care practices."
        }
    }
};


// =========================
// Scan Your Crop
// =========================

scanBtn.addEventListener("click", function () {

    document.getElementById("scanner").scrollIntoView({
        behavior: "smooth"
    });

    setTimeout(function () {
        imageInput.click();
    }, 500);

});


// =========================
// Choose Image
// =========================

uploadBtn.addEventListener("click", function () {

    imageInput.click();

});


// =========================
// Image Preview
// =========================

imageInput.addEventListener("change", function () {

    const file = imageInput.files[0];

    if (!file) {
        return;
    }


    // =========================
    // Image Validation
    // =========================

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];


    if (!allowedTypes.includes(file.type)) {

        result.innerHTML = `
            <div class="analysis-result">

                <h3>❌ Invalid Image</h3>

                <p>
                    Please select a JPG, PNG or WEBP image.
                </p>

            </div>
        `;

        imageInput.value = "";
        preview.style.display = "none";

        return;
    }


    // =========================
    // Show Image Preview
    // =========================

    const imageURL = URL.createObjectURL(file);

    preview.src = imageURL;

    preview.style.display = "block";

    result.innerHTML = "";

    console.log("Image selected:", file.name);

});;


// =========================
// Analyze Crop using Flask
// =========================

analyzeBtn.addEventListener("click", async function () {

    // Check image
    if (!imageInput.files.length) {

        result.innerHTML = `
            <p class="error">
                ⚠️ Please upload a crop image first.
            </p>
        `;

        return;
    }

    // Show loading
    result.innerHTML = `
        <div class="analysis-result">
            <h3>🤖 Analyzing Crop...</h3>
            <p>Please wait while CropCare AI analyzes the image.</p>
        </div>
    `;

    // Create form data
    const formData = new FormData();

    formData.append("image", imageInput.files[0]);

    try {

        // Send image to Flask
        const response = await fetch(
            "/api/predict",
            {
                method: "POST",
                body: formData
           }
        );

        // Convert response to JSON
        const data = await response.json();

        // Check backend error
        if (!response.ok) {
            throw new Error(data.error || "Prediction failed");
        }

        console.log("AI Response:", data);


        // Get disease information
        const crop = data.crop;
        const diseaseName = data.disease;
        const confidence = data.confidence;
        // =========================
// Confidence Progress Bar
// =========================

const confidenceBar = `
    <div class="confidence-container">

        <div class="confidence-header">
            <strong>Confidence</strong>
            <span>${confidence}%</span>
        </div>

        <div class="confidence-bar">
            <div
                class="confidence-fill"
                style="width: ${Math.min(Math.max(Number(confidence), 0), 100)}%;"
            </div>
        </div>

    </div>
`;
        const topPredictions = data.top_predictions || [];

let topPredictionsHTML = "";

if (topPredictions.length > 0) {

    topPredictionsHTML = `
    <hr>

    <h4>🔎 Top Predictions</h4>

    <div class="top-predictions">

        ${topPredictions.map((prediction, index) => `
            
            <div class="prediction-card">

                <div class="prediction-title">
                    <strong>
                        #${index + 1}
                        ${prediction.crop}
                    </strong>

                    <span>
                        ${prediction.confidence}%
                    </span>
                </div>

                <p>
                    ${prediction.disease}
                </p>

                <div class="prediction-bar">
                    <div
                        class="prediction-fill"
                        style="width: ${Math.min(
                            Math.max(Number(prediction.confidence), 0),
                            100
                        )}%;">
                    </div>
                </div>

            </div>

        `).join("")}

    </div>
`;
}
        
	// =========================
	// Confidence Level
	// =========================

	let confidenceLevel = "";
	let confidenceMessage = "";

	if (confidence >= 70) {

    	confidenceLevel = "High";
    	confidenceMessage = "The model is highly confident in this prediction.";

	} else if (confidence >= 40) {

    	confidenceLevel = "Moderate";
    	confidenceMessage = "The model has moderate confidence. Consider uploading a clearer leaf image.";

	} else {

    	confidenceLevel = "Low";
    	confidenceMessage = "The model has low confidence. Please upload a clear crop-leaf image for a better result.";

	}



        const disease =
            diseaseData[crop]?.[diseaseName];


        // Show result
        if (disease) {

            result.innerHTML = `
                <div class="analysis-result">

                    <h3>🌿 Analysis Complete</h3>

                    <p>
                        <strong>Crop:</strong>
                        ${crop}
                    </p>

                    <p>
                        <strong>Possible Disease:</strong>
                        ${diseaseName}
                    </p>

                    ${confidenceBar}
		    <p>
    			<strong>Confidence Level:</strong>
    			${confidenceLevel}
		    </p>

		    <p>
    			${confidenceMessage}
		    </p>
                    ${topPredictionsHTML}

                    <hr>

                    <h4>🔍 Symptoms</h4>
                    <p>${disease.symptoms}</p>

                    <h4>⚠️ Possible Causes</h4>
                    <p>${disease.causes}</p>

                    <h4>🛡️ Prevention</h4>
                    <p>${disease.prevention}</p>

                    <h4>🌱 Management</h4>
                    <p>${disease.management}</p>

                </div>
            `;

        } else {

            result.innerHTML = `
                <h3>🌿 Analysis Complete</h3>

                <p>
                    <strong>Crop:</strong> ${crop}
                </p>

                <p>
                    <strong>Disease:</strong> ${diseaseName}
                </p>

                <p>
                    <strong>Confidence:</strong> ${confidence}%
                </p>

                <p>
                    Disease information is not available
                    in the current database.
                </p>
            `;
        }

    } catch (error) {

        console.error("Prediction error:", error);

        result.innerHTML = `
            <div class="analysis-result">

                <h3>❌ Analysis Failed</h3>

                <p>
                    Could not connect to the CropCare AI server.
                </p>

                <p>
                    Please try again. The CropCare AI server may be temporarily unavailable.
                </p>

            </div>
        `;
    }

});





// =========================
// Crop Library
// =========================

const cropCards =
    document.querySelectorAll(".crop-card");

const cropDetails =
    document.getElementById("cropDetails");


cropCards.forEach(function (card) {

    const button =
        card.querySelector(".view-crop-btn");


    button.addEventListener("click", function () {

        const cropName =
            card.dataset.crop;

        const diseases =
            diseaseData[cropName];


        cropDetails.style.display = "block";


        let diseaseList = "";


        for (const diseaseName in diseases) {

            diseaseList += `

                <li>

                    <button
                        class="disease-btn"
                        data-crop="${cropName}"
                        data-disease="${diseaseName}">
                        ${diseaseName}
                    </button>

                </li>

            `;
        }


        cropDetails.innerHTML = `

            <h3>🌱 ${cropName} Diseases</h3>

            <p>
                Select a disease to see details.
            </p>

            <ul class="disease-list">

                ${diseaseList}

            </ul>

            <div id="diseaseInfo"></div>

        `;


        addDiseaseButtonEvents();


        cropDetails.scrollIntoView({
            behavior: "smooth"
        });

    });

});


// =========================
// Disease Details
// =========================

function addDiseaseButtonEvents() {

    const diseaseButtons =
        document.querySelectorAll(".disease-btn");


    diseaseButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const cropName =
                this.dataset.crop;

            const diseaseName =
                this.dataset.disease;


            const disease =
                diseaseData[cropName][diseaseName];


            const diseaseInfo =
                document.getElementById("diseaseInfo");


            diseaseInfo.innerHTML = `

                <div class="disease-info">

                    <h3>
                        🦠 ${diseaseName}
                    </h3>

                    <h4>
                        🔍 Symptoms
                    </h4>

                    <p>
                        ${disease.symptoms}
                    </p>


                    <h4>
                        ⚠️ Possible Causes
                    </h4>

                    <p>
                        ${disease.causes}
                    </p>


                    <h4>
                        🛡️ Prevention
                    </h4>

                    <p>
                        ${disease.prevention}
                    </p>


                    <h4>
                        🌱 Management
                    </h4>

                    <p>
                        ${disease.management}
                    </p>

                </div>

            `;


            diseaseInfo.scrollIntoView({
                behavior: "smooth"
            });

        });

    });

}