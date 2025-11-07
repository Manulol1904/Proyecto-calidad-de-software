from selenium.webdriver.common.by import By
from pages.base_page import BasePage


class LoginPage(BasePage):
    """Página de Login"""
    
    # Locators
    EMAIL_INPUT = (By.CSS_SELECTOR, "input[type='email']")
    PASSWORD_INPUT = (By.CSS_SELECTOR, "input[type='password']")
    LOGIN_BUTTON = (By.CLASS_NAME, "login-btn")
    REGISTER_BUTTON = (By.CLASS_NAME, "register-btn")
    FORGOT_PASSWORD_LINK = (By.CLASS_NAME, "forgot-link")
    ERROR_MESSAGE = (By.CLASS_NAME, "login-error")
    
    def __init__(self, driver):
        super().__init__(driver)
        self.url = "http://localhost:5173/login"
    
    def navigate(self):
        """Navegar a la página de login"""
        self.driver.get(self.url)
    
    def enter_email(self, email):
        """Ingresar email"""
        self.send_keys(self.EMAIL_INPUT, email)
    
    def enter_password(self, password):
        """Ingresar contraseña"""
        self.send_keys(self.PASSWORD_INPUT, password)
    
    def click_login(self):
        """Click en botón de login"""
        self.click(self.LOGIN_BUTTON)
    
    def click_register(self):
        """Click en botón de registro"""
        self.click(self.REGISTER_BUTTON)
    
    def click_forgot_password(self):
        """Click en enlace de recuperar contraseña"""
        self.click(self.FORGOT_PASSWORD_LINK)
    
    def login(self, email, password):
        """Realizar login completo"""
        self.enter_email(email)
        self.enter_password(password)
        self.click_login()
    
    def is_error_displayed(self):
        """Verificar si se muestra mensaje de error"""
        return self.is_displayed(self.ERROR_MESSAGE)
    
    def get_error_message(self):
        """Obtener texto del mensaje de error"""
        return self.get_text(self.ERROR_MESSAGE)