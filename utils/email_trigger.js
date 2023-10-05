const email_trigger = {
    "accept": {
        "template": "email_templates/Admin_Accept.html",
        "subject": "Customer MosAIc: Your request for access has been approved",
        "image":{
            "logo": process.env.BASE_URL +'/asset/logo-253x76.png',
            "header": process.env.BASE_URL +'/asset/head_footer.png',
            "background": process.env.BASE_URL +'/asset/background.jpg'
        }
    },
    "request": {
        "template": "email_templates/New_Access.html",
        "subject": "Customer MosAIc: Welcome to customer mosAIc",
        "image":{
            "logo": process.env.BASE_URL +'/asset/logo-253x76.png',
            "header": process.env.BASE_URL +'/asset/head_footer.png' 
        }
    },
    "decline": {
        "template": "email_templates/Admin_Decline.html",
        "subject": "Customer MosAIc: Your request for access has been rejected",
        "image":{
            "logo": process.env.BASE_URL +'/asset/logo-253x76.png',
            "header": process.env.BASE_URL +'/asset/head_footer.png',
            "background": process.env.BASE_URL +'/asset/background.jpg'
        }
    },
    "custom": {
        "template": "email_templates/custom_text.html",
        "subject": "Customer MosAIc: {{custom_subject}}",
        "image":{
            "logo": process.env.BASE_URL +'/asset/logo-253x76.png',
            "header": process.env.BASE_URL +'/asset/head_footer.png',
            "background": process.env.BASE_URL +'/asset/background.jpg'
        }
    },
    "alert": {
        "type": "dev",
        "template": "email_templates/service_alert.html",
        "subject": "CM "+process.env.NODE_ENV.toUpperCase()+" Log Alert - Error - {{error_description}}",
        "image":{
            "logo": process.env.BASE_URL +'/asset/logo-253x76.png',
            "header": process.env.BASE_URL +'/asset/head_footer.png',
            "background": process.env.BASE_URL +'/asset/background.jpg'
        }
    }
}

module.exports = email_trigger
