"""Configuración compartida para todos los tests"""
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options


@pytest.fixture(scope="session")
def browser():
    """Fixture para configurar el navegador una vez por sesión"""
    chrome_options = Options()
    # Descomentar para modo headless (sin ventana)
    # chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    driver = webdriver.Chrome(options=chrome_options)
    driver.maximize_window()
    
    yield driver
    
    driver.quit()


@pytest.fixture
def test_user():
    """Datos de usuario de prueba"""
    return {
        "email": "manu123@gmail.com",
        "password": "manu123",
        "name": "Usuario Test",
        "income": "3000000"
    }
