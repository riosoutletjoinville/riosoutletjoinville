import HeaderTop from "./HeaderTop";
import HeaderMain from "./HeaderMain";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      {/* HeaderTop visível apenas em desktop */}
      <HeaderTop />
      
      {/* HeaderMain contém o MobileMenu e logo */}
      <HeaderMain />
    </header>
  );
}