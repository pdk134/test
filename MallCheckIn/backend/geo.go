package main

import "math"

// haversine 计算两个经纬度点之间的距离（米）
// 参数：纬度1、经度1、纬度2、经度2
func haversine(lat1, lng1, lat2, lng2 float64) float64 {
	const earthRadius = 6371000.0 // 地球半径，单位：米

	rad := math.Pi / 180
	phi1 := lat1 * rad
	phi2 := lat2 * rad
	dPhi := (lat2 - lat1) * rad
	dLambda := (lng2 - lng1) * rad

	a := math.Sin(dPhi/2)*math.Sin(dPhi/2) +
		math.Cos(phi1)*math.Cos(phi2)*math.Sin(dLambda/2)*math.Sin(dLambda/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadius * c
}
