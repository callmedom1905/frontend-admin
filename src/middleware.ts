import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define which routes are accessible by which roles
const routePermissions = {
  "/quan-ly-hoa-don": ["manager" ,"staff"],
  "/quan-ly-dat-ban": ["manager", "staff"],
  "/quan-ly-ban": ["manager", "staff"],
  "/quan-ly-menu": ["manager" ,"staff"],
  "/quan-ly-bai-viet": ["manager"],
  "/quan-ly-nhan-vien": ["manager"],
  "/quan-ly-nguoi-dung": ["manager"],
  "/quan-ly-phuong-thuc-thanh-toan": ["manager"],
  "/thu-vien": ["manager"],
  "/line-chart": ["manager"],
  "/bar-chart": ["manager"],

};

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const userStr = request.cookies.get("user")?.value;
  
  // If no token or user data, redirect to login
  if (!token || !userStr) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  try {
    const user = JSON.parse(userStr);
    const pathname = request.nextUrl.pathname;

    // Check if the current path requires specific permissions
    const requiredRoles = routePermissions[pathname as keyof typeof routePermissions];
    
    if (requiredRoles) {
      // If the user's role is not in the required roles, redirect to 404
      if (!requiredRoles.includes(user.role.guard_name)) {
        return NextResponse.redirect(new URL("/error-404", request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    // If there's any error parsing user data, redirect to login
    return NextResponse.redirect(new URL("/signin", request.url));
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/quan-ly-hoa-don/:path*',
    '/quan-ly-dat-ban/:path*',
    '/quan-ly-menu/:path*',
    '/quan-ly-bai-viet/:path*',
    '/quan-ly-nhan-vien/:path*',
    '/quan-ly-nguoi-dung/:path*',
    '/quan-ly-phuong-thuc-thanh-toan/:path*',
    '/thu-vien/:path*',
    '/line-chart/:path*',
    '/bar-chart/:path*',
  ],
}; 