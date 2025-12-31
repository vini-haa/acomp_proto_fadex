import { cn } from "@/lib/utils";

describe("cn (className utility)", () => {
  it("deve combinar classes simples", () => {
    const result = cn("class1", "class2");
    expect(result).toBe("class1 class2");
  });

  it("deve lidar com classes condicionais", () => {
    const result = cn("base", { active: true, disabled: false });
    expect(result).toBe("base active");
  });

  it("deve mesclar classes Tailwind corretamente", () => {
    const result = cn("p-4", "p-2"); // Tailwind merge deve manter apenas p-2
    expect(result).toBe("p-2");
  });

  it("deve ignorar valores falsy", () => {
    const result = cn("base", null, undefined, "", "valid");
    expect(result).toBe("base valid");
  });
});
