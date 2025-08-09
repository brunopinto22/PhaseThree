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
        tuple: A tuple containing the user ID and type if the token is valid.
               If the token is expired, returns ("Expired Token.", None).
               If the token is invalid, returns ("Invalid Token", None).
               If the payload does not contain 'user_id', returns ("Payload does not contain 'user_id'.", None).
    Raises:
        jwt.ExpiredSignatureError: If the token has expired.
        jwt.InvalidTokenError: If the token is invalid.
        KeyError: If the payload does not contain 'user_id'.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = payload['user_id']
        email = payload['email']
        type = payload['type']
        return user_id, email, type
    except jwt.ExpiredSignatureError:

        return "Expired Token.", None
    except jwt.InvalidTokenError:
        return "Invalid Token", None
    except KeyError:
        return "Payload does not contain 'user_id'.", None


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
