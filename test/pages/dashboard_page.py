from selenium.webdriver.common.by import By
from pages.base_page import BasePage


class DashboardPage(BasePage):
    """Página de Dashboard"""
    
    # Locators
    TITLE = (By.XPATH, "//*[contains(text(), 'Mi Panel')]")
    SUMMARY_CARDS = (By.CLASS_NAME, "summary-card")
    CHARTS = (By.TAG_NAME, "canvas")
    GASTOS_LINK = (By.XPATH, "//a[contains(text(), 'Gastos')]")
    CONFIG_LINK = (By.XPATH, "//a[contains(text(), 'Configuración')]")
    LOGOUT_BUTTON = (By.XPATH, "//button[contains(text(), 'Cerrar sesión')]")
    
    def __init__(self, driver):
        super().__init__(driver)
        self.url = "http://localhost:5173/"
    
    def is_loaded(self):
        """Verificar si el dashboard está cargado"""
        return self.is_displayed(self.TITLE)
    
    def get_summary_cards_count(self):
        """Obtener número de tarjetas de resumen"""
        cards = self.driver.find_elements(*self.SUMMARY_CARDS)
        return len(cards)
    
    def get_charts_count(self):
        """Obtener número de gráficas"""
        charts = self.driver.find_elements(*self.CHARTS)
        return len(charts)
    
    def navigate_to_expenses(self):
        """Navegar a página de gastos"""
        self.click(self.GASTOS_LINK)
    
    def navigate_to_config(self):
        """Navegar a configuración"""
        self.click(self.CONFIG_LINK)
    
    def logout(self):
        """Cerrar sesión"""
        self.click(self.LOGOUT_BUTTON)
        self.accept_alert()