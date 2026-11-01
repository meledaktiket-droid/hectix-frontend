import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ProfileClient } from "@/components/profile/profile-client";
import { SignInGate } from "@/components/sign-in-gate";
import { getSession } from "@/lib/api";

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    return (
      <>
        <Navbar title="Profil Anda" variant="home" />
        <SignInGate
          title="Masuk untuk melihat profil"
          description="Kelola akun dan aktivitasmu setelah masuk."
          callbackURL="/profile"
        />
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar title="Profil Anda" variant="home" />
      <div className="-mt-[60px] bg-[#F2F2F2] pb-16">
        <ProfileClient />
      </div>
      <Footer />
    </>
  );
}
