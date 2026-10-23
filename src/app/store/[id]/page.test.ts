import { beforeEach, describe, expect, it, vi } from "vitest";
import ProductPage from "@/app/store/[id]/page";
import { fetchProductById } from "@/lib/product-lookup";
import type { Product } from "@/lib/types";

vi.mock("@/lib/product-lookup", () => ({
  fetchProductById: vi.fn(),
}));

const fetchProductByIdMock = vi.mocked(fetchProductById);

const sampleProduct = {
  id: "1",
  title: "VINTAGE",
  subtitle: "Vacuum Pups",
} as Product;

describe("ProductPage", () => {
  beforeEach(() => {
    fetchProductByIdMock.mockReset();
  });

  it("calls notFound() when the product is missing", async () => {
    fetchProductByIdMock.mockResolvedValue(null);

    await expect(
      ProductPage({
        params: Promise.resolve({ id: "missing-product-f7" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(fetchProductByIdMock).toHaveBeenCalledWith("missing-product-f7");
  });

  it("renders the product client when a record exists", async () => {
    fetchProductByIdMock.mockResolvedValue(sampleProduct);

    const element = await ProductPage({
      params: Promise.resolve({ id: "1" }),
    });

    expect(element).toBeTruthy();
    expect(element.props.product).toEqual(sampleProduct);
  });
});
