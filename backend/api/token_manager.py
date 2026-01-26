import jwt
import datetime
from django.http import JsonResponse
from rest_framework.decorators import api_view
from django.conf import settings

JWT_SECRET_KEY = settings.JWT_SECRET_KEY
JWT_ALGORITHM = settings.JWT_ALGORITHM


def generate_token(id, email, type):
    return jwt.encode({
        'user_id': id,
        'email': email,
        'type': type,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
    }, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_token(token):
    """
    Decodes a JWT token to extract the user ID and type.
    Args:
        token (str): The JWT token to decode.
    Returns:
        tuple: A tuple containing (user_id, email, type) if the token is valid.
               If the token is expired, returns ("Expired Token.", None, None).
               If the token is invalid, returns ("Invalid Token", None, None).
               If the payload does not contain required fields, returns ("Payload error", None, None).
    """
    try:
        # Remove "Bearer " prefix if present
        if token and token.startswith('Bearer '):
            token = token[7:]
        
        if not token:
            return "No token provided", None, None
            
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        email = payload.get('email')
        user_type = payload.get('type')
        
        return user_id, email, user_type
    except jwt.ExpiredSignatureError:
        return "Expired Token.", None, None
    except jwt.InvalidTokenError:
        return "Invalid Token", None, None
    except KeyError:
        return "Payload does not contain 'user_id'.", None, None
    except Exception as e:
        return f"Token decode error: {str(e)}", None, None


def verify_token(token):
    """
    Verifies the given JWT token.

    This function decodes and verifies the provided JWT token using the
    specified secret key and algorithm. If the token is valid, it returns
    the decoded token. If the token has expired or is invalid, it returns None.

    Args:
        token (str): The JWT token to be verified.

    Returns:
        dict or None: The decoded token if valid, otherwise None.
    """
    try:
        # Decode and verify the token
        decoded = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        #print("Token is valid:", decoded)
        return decoded
    except jwt.ExpiredSignatureError:
        #print("Token has expired")
        return None
    except jwt.InvalidTokenError:
        #print("Invalid token")
        return None
