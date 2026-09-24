import { Checkout } from "../../components/Checkout";
import { PRODUCTS } from "@/lib/payment/config";

const product = PRODUCTS["fc27-standard"];

export default function FC27PaymentPage() {
  return (
    <Checkout
      product={product}
      image="/games/fc27/fc27-city.webp"
      imageAlt="EA FC 27 Standard Edition"
      editionLabel="Standard Edition"
      bankNote="FC27"
      backHref="/games/fc27/select"
      backLabel="Quay lại trang FC 27"
      codeEntryHref="/games/fc27"
    />
  );
}
