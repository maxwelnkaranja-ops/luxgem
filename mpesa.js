export async function initiateSTKPush(phoneNumber, amount, orderId) {
    try {
        const response = await fetch('/api/stkpush', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phoneNumber, amount, orderId })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to initiate payment');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error in initiateSTKPush:', error);
        throw error;
    }
}
