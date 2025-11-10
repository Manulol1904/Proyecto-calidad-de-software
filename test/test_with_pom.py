import unittest
import time
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait

from pages.login_page import LoginPage
from pages.register_page import RegisterPage
from pages.dashboard_page import DashboardPage
from pages.expenses_page import ExpensesPage
from pages.settings_page import SettingsPage


class TestsWithPOM(unittest.TestCase):
    """Suite de tests usando Page Object Model"""
    
    @classmethod
    def setUpClass(cls):
        """Configuración inicial"""
        cls.driver = webdriver.Chrome()
        cls.driver.maximize_window()
        cls.wait = WebDriverWait(cls.driver, 10)
        
        # Credenciales de prueba
        cls.test_user = {
            "email": "cris123@gmail.com",
            "password": "147258369",
            "name": "Usuario Test",
            "income": "3000000"
        }
        
        # Inicializar páginas
        cls.login_page = LoginPage(cls.driver)
        cls.register_page = RegisterPage(cls.driver)
        cls.dashboard_page = DashboardPage(cls.driver)
        cls.expenses_page = ExpensesPage(cls.driver)
        cls.settings_page = SettingsPage(cls.driver)
    
    @classmethod
    def tearDownClass(cls):
        """Limpieza final"""
        cls.driver.quit()
    
    def setUp(self):
        """Antes de cada test"""
        self.login_page.navigate()
        time.sleep(1)
    
    # Tests
    def test_01_login_exitoso(self):
        """Test: Login con POM"""
        print("\n🧪 Test POM: Login exitoso")
        
        self.login_page.login(
            self.test_user["email"],
            self.test_user["password"]
        )
        
        time.sleep(2)
        
        self.assertTrue(self.dashboard_page.is_loaded())
        print("✅ Login exitoso usando POM")
    
    def test_02_agregar_gasto_con_pom(self):
        """Test: Agregar gasto con POM"""
        print("\n🧪 Test POM: Agregar gasto")
        
        # Login
        self.login_page.login(
            self.test_user["email"],
            self.test_user["password"]
        )
        time.sleep(2)
        
        # Navegar a gastos
        self.dashboard_page.navigate_to_expenses()
        time.sleep(1)
        
        # Agregar gasto
        self.expenses_page.add_expense(
            title="Test POM",
            amount="25000",
            category="Testing",
            expense_type="expense"
        )
        time.sleep(2)
        
        # Verificar
        self.assertTrue(self.expenses_page.is_expense_in_table("Test POM"))
        print("✅ Gasto agregado usando POM")
    
    def test_03_actualizar_perfil_con_pom(self):
        """Test: Actualizar perfil con POM"""
        print("\n🧪 Test POM: Actualizar perfil")
        
        # Login
        self.login_page.login(
            self.test_user["email"],
            self.test_user["password"]
        )
        time.sleep(2)
        
        # Navegar a configuración
        self.dashboard_page.navigate_to_config()
        time.sleep(1)
        
        # Actualizar nombre
        self.settings_page.update_name("Nombre Actualizado POM")
        self.settings_page.save_profile()
        time.sleep(2)
        
        print("✅ Perfil actualizado usando POM")


if __name__ == "__main__":
    unittest.main(verbosity=2)