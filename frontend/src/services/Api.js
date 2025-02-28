export const API_BASE_URL = "http://localhost:3000"; 

const getAuthHeader = () => {
    const token = localStorage.getItem('token');  // Retrieve token from localStorage
    if (token) {
        return {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        };
    }
    return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };
};

export const getIdTitleAllContents = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api`, {
            method: 'GET',
            headers: getAuthHeader(),  // Include Authorization header if token exists
        });

        if (!response.ok) {
            throw new Error('Failed to fetch contents');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching contents:', error);
        throw error;
    }
};

export const getContentByID = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/content/${id}`, {
            method: 'GET',
            headers: getAuthHeader(),  // Include Authorization header if token exists
        });
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error; // Rethrow error for handling in component
    }
};

export const login = async (email, password) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'login failed');
        }
        return await response.json();

    } catch (error) {
        console.error('Error during login:', error);
        throw error;
    }
};

export const updateContentByID = async (id, content, subheadings) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/content/edit/${id}`, {
            method: 'PUT',
            headers: {
                ...getAuthHeader(),  // Include Authorization header if token exists
            },
            body: JSON.stringify({ content, subheadings }),
        });
        if (!response.ok) {
            throw new Error('Failed to update content');
        }
        return await response.json();
    } catch (error) {
        console.error('Error updating content:', error);
        throw error;
    }
};

export const addContent = async (contentData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/content/add`, {
        method: 'POST',
        headers: {
          ...getAuthHeader(),  // Include Authorization header if token exists
        },
        body: JSON.stringify(contentData),
      });
  
      if (!response.ok) {
        throw new Error('Failed to create content');
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error in addContent:', error);
      throw error;
    }
};
