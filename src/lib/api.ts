import type { Complaint } from "@/types/complaint"

const API_BASE_URL = "http://127.0.0.1:5000"

// Helper function to get the token from localStorage
const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token")
  }
  return null
}

// Helper function to create headers with authorization
const createAuthHeaders = () => {
  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  return headers
}

// Login user - Updated to use form data for OAuth2
export async function loginUser(username: string, password: string) {
  try {
    // Create URLSearchParams for OAuth2 form data format
    const formData = new URLSearchParams()
    formData.append("username", username)
    formData.append("password", password)

    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
      credentials: "include", // Important for cookies
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        message: errorData.detail || "Login failed",
      }
    }

    const data = await response.json()

    // Store the token in localStorage
    if (data.access_token) {
      localStorage.setItem("token", data.access_token)
    }

    return {
      success: true,
      ...data,
    }
  } catch (error) {
    console.error("Error logging in:", error)
    return {
      success: false,
      message: "An error occurred during login",
    }
  }
}

// Fetch complaints
export async function fetchComplaints(): Promise<Complaint[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/io_portal_json`, {
      headers: createAuthHeaders(),
      credentials: "include", // Important for cookies
    })

    if (response.status === 401) {
      // Handle unauthorized - redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/"
      }
      return []
    }

    if (!response.ok) {
      throw new Error("Failed to fetch complaints")
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error("Error fetching complaints:", error)
    return []
  }
}

// Fetch complaint files
export async function fetchComplaintFiles(
  ticketNumber: string,
  fileCategory: string,
): Promise<Array<{ type: string; url: string; filename?: string }>> {
  try {
    const token = getToken()
    const headers: Record<string, string> = {}

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}/get_complaint_files/${ticketNumber}/${fileCategory}`, {
      headers,
      credentials: "include",
    })

    if (response.status === 401) {
      // Handle unauthorized - redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/"
      }
      return []
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch ${fileCategory} files`)
    }

    const data = await response.json()
    return data.files || []
  } catch (error) {
    console.error(`Error fetching ${fileCategory} files:`, error)
    return []
  }
}



// Share complaint timeline via email
export async function shareComplaintTimeline(data: {
  email: string
  subject: string
  complaintId: string
  html: string
  css: string
}) {
  try {
    const response = await fetch(`${API_BASE_URL}/share_complaint_timeline`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
      credentials: "include",
    })

    if (response.status === 401) {
      // Handle unauthorized - redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/"
      }
      return { success: false }
    }

    if (!response.ok) {
      throw new Error("Failed to share timeline")
    }

    return await response.json()
  } catch (error) {
    console.error("Error sharing timeline:", error)
    return { success: false, message: "Failed to share timeline" }
  }
}
export async function fetchUserNotifications(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/get_user_notifications}`, {
      headers: createAuthHeaders(),
      credentials: "include", // Important for cookies
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to fetch notifications: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error: any) {
    console.error("Error fetching notifications:", error)
    return []
  }
}

// Function to update user notifications (mark as read)
export async function updateUserNotifications(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/update_user_notifications`, {
      method: "POST",
      headers: createAuthHeaders(),
      credentials: "include", // Important for cookies
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        message: errorData.detail || "Failed to update notifications",
      }
    }

    const data = await response.json()
    return {
      success: true,
      ...data,
    }
  } catch (error: any) {
    console.error("Error updating notifications:", error)
    return {
      success: false,
      message: "An error occurred while updating notifications",
    }
  }
}
// Fetch IO users
export async function fetchIOUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/get_io_users`, {
      headers: createAuthHeaders(),
      credentials: "include",
    })

    if (response.status === 401) {
      // Handle unauthorized - redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/"
      }
      return []
    }

    if (!response.ok) {
      throw new Error("Failed to fetch IO users")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching IO users:", error)
    return []
  }
}

// Submit complaint form
export async function submitComplaintForm(formData: FormData) {
  try {
    // Get the token and add it to the request
    const token = getToken()

    const response = await fetch(`${API_BASE_URL}/submit_form`, {
      method: "POST",
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
      body: formData,
      credentials: "include",
    })

    if (response.status === 401) {
      // Handle unauthorized - redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/"
      }
      return { success: false }
    }

    if (!response.ok) {
      throw new Error("Failed to submit form")
    }

    return await response.json()
  } catch (error) {
    console.error("Error submitting form:", error)
    return { success: false }
  }
}

// Route complaint via email
export async function routeComplaintViaEmail(data: any) {
  try {
    const response = await fetch(`${API_BASE_URL}/route_via_email`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
      credentials: "include",
    })

    if (response.status === 401) {
      // Handle unauthorized - redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/"
      }
      return { success: false }
    }

    if (!response.ok) {
      throw new Error("Failed to route complaint via email")
    }

    return await response.json()
  } catch (error) {
    console.error("Error routing complaint via email:", error)
    return { success: false }
  }
}

// Route complaint via portal
export async function routeComplaintViaPortal(data: any) {
  try {
    const response = await fetch(`${API_BASE_URL}/route_via_portal`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
      credentials: "include",
    })

    if (response.status === 401) {
      // Handle unauthorized - redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/"
      }
      return { success: false }
    }

    if (!response.ok) {
      throw new Error("Failed to route complaint via portal")
    }

    return await response.json()
  } catch (error) {
    console.error("Error routing complaint via portal:", error)
    return { success: false }
  }
}

// Get complaint route history
export async function getComplaintRouteHistory(ticketNumber: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/get_complaint_route_history/${ticketNumber}`, {
      headers: createAuthHeaders(),
      credentials: "include",
    })

    if (response.status === 401) {
      // Handle unauthorized - redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/"
      }
      return { success: false, history: [] }
    }

    if (!response.ok) {
      throw new Error("Failed to fetch complaint route history")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching complaint route history:", error)
    return { success: false, history: [] }
  }
}

// Logout user
export async function logoutUser() {
  try {
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: "POST",
      headers: createAuthHeaders(),
      credentials: "include",
    })

    // Clear the token regardless of the response
    localStorage.removeItem("token")

    if (!response.ok) {
      throw new Error("Failed to logout")
    }

    return await response.json()
  } catch (error) {
    console.error("Error logging out:", error)
    // Still clear the token even if there's an error
    localStorage.removeItem("token")
    return { success: false }
  }
}

