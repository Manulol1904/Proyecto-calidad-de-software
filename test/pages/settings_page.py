from selenium.webdriver.common.by import By
from pages.base_page import BasePage


class SettingsPage(BasePage):
    """Página de Configuración"""
    
    # Locators
    NAME_INPUT = (By.CSS_SELECTOR, "input[placeholder='Tu nombre']")
    USERNAME_INPUT = (By.CSS_SELECTOR, "input[placeholder='username']")
    EMAIL_INPUT = (By.CSS_SELECTOR, "input[type='email']")
    INCOME_INPUT = (By.CSS_SELECTOR, "input[type='number']")
    INCOME_TYPE_SELECT = (By.CSS_SELECTOR, "select")
    SAVE_PROFILE_BUTTON = (By.XPATH, "//button[contains(text(), 'Guardar cambios')]")
    UPDATE_INCOME_BUTTON = (By.XPATH, "//button[contains(text(), 'Actualizar configuración')]")
    
    def __init__(self, driver):
        super().__init__(driver)
        self.url = "http://localhost:5173/config"
    
    def navigate(self):
        """Navegar a configuración"""
        self.driver.get(self.url)
    
    def update_name(self, name):
        """Actualizar nombre"""
        self.send_keys(self.NAME_INPUT, name)
    
    def update_username(self, username):
        """Actualizar username"""
        self.send_keys(self.USERNAME_INPUT, username)
    
    def save_profile(self):
        """Guardar cambios de perfil"""
        self.click(self.SAVE_PROFILE_BUTTON)
    
    def update_income(self, income):
        """Actualizar ingreso"""
        self.send_keys(self.INCOME_INPUT, str(income))
    
    def change_income_type(self, income_type="monthly"):
        """Cambiar tipo de ingreso"""
        select = self.find_element(self.INCOME_TYPE_SELECT)
        select.click()
        
        options = select.find_elements(By.TAG_NAME, "option")
        if income_type == "monthly":
            options[0].click()
        else:
            options[1].click()
    
    def save_income_config(self):
        """Guardar configuración de ingreso"""
        self.click(self.UPDATE_INCOME_BUTTON)
